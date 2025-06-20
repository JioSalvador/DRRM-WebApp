const pool = require('../../db');
const path = require('path');
const fs = require('fs');

// Helper: Clean quotes around strings
const clean = (val) => {
  if (typeof val === 'string' && val.startsWith('"') && val.endsWith('"')) {
    return val.slice(1, -1);
  }
  return val;
};

// Shared helper
const finalizeRequestFromData = async (client, userId, {
  idDocumentPath,
  proofOfPaymentPath,
  delivery_address,
  full_name,
  birthdate, // ✅ Add birthdate
  last_sy_attended,
  course,
  documentsJson,
  special_request = null // ✅ Optional special request
}) => {
  let documentItems = [];

  if (typeof documentsJson === 'string') {
    try {
      documentItems = JSON.parse(documentsJson);
    } catch (e) {
      throw new Error('Invalid JSON format for documents');
    }
  } else if (Array.isArray(documentsJson)) {
    documentItems = documentsJson;
  }

  const now = new Date();

  const userResult = await client.query(
    `SELECT alumni_expiration FROM public.users WHERE id = $1`,
    [userId]
  );

  const alumniExpiration = userResult.rows[0]?.alumni_expiration;
  const isAlumni = alumniExpiration && new Date(alumniExpiration) > now;

  let totalCost = 0;

  for (const doc of documentItems) {
    const { rows } = await client.query(
      `SELECT unit_price FROM services.document_types WHERE name = $1 AND is_active = TRUE`,
      [doc.type]
    );

    if (rows.length === 0) {
      throw new Error(`Invalid document type: ${doc.type}`);
    }

    const unitPrice = rows[0].unit_price;
    doc.unit_price = unitPrice;
    totalCost += unitPrice * (doc.quantity || 1);
  }

  let alumniFee = 0;
  if (!isAlumni) {
    alumniFee = 500;
    totalCost += alumniFee;
  }

  const insertRequest = await client.query(
    `INSERT INTO services.document_requests (
      user_id, id_document_path, proof_of_payment,
      delivery_address, is_alumni_member, alumni_fee, total_cost,
      full_name, birthdate, last_sy_attended, course,
      special_request
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id`,
    [
      userId,
      idDocumentPath,
      proofOfPaymentPath,
      clean(delivery_address),
      isAlumni,
      alumniFee,
      totalCost,
      clean(full_name),
      birthdate,
      last_sy_attended,
      clean(course),
      special_request ? clean(special_request) : null
    ]
  );

  const requestId = insertRequest.rows[0].id;

  for (const doc of documentItems) {
    await client.query(
      `INSERT INTO services.document_request_items (
        request_id, document_type, quantity, unit_price
      ) VALUES ($1, $2, $3, $4)`,
      [requestId, doc.type, doc.quantity, doc.unit_price]
    );
  }

  return { requestId, totalCost, alumniFee };
};

const getDraftById = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const draftId = req.params.id;

    const result = await client.query(
      `SELECT * FROM services.document_request_drafts WHERE id = $1 AND user_id = $2`,
      [draftId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Draft not found' });
    }

    const draft = result.rows[0];
    // Clean unnecessary quotes before sending back
    draft.full_name = clean(draft.full_name);
    draft.course = clean(draft.course);
    draft.delivery_address = clean(draft.delivery_address);

    res.status(200).json({ success: true, draft });
  } catch (err) {
    console.error('Error in getDraftById:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
};

const getDrafts = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;

    const result = await client.query(
      `SELECT id, full_name, course, last_sy_attended, created_at
       FROM services.document_request_drafts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const drafts = result.rows.map(d => ({
      ...d,
      full_name: clean(d.full_name),
      course: clean(d.course),
    }));

    res.status(200).json({ success: true, drafts });
  } catch (err) {
    console.error('Error in getDrafts:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
};

const createClientRequest = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;

    if (!req.files?.id_document || !req.files?.proof_of_payment) {
      return res.status(400).json({
        success: false,
        message: 'Both ID document and proof of payment are required.'
      });
    }

    const idDocumentPath = req.files.id_document[0].path;
    const proofOfPaymentPath = req.files.proof_of_payment[0].path;

    // 🔽 Fetch full_name and birthdate from the user table
    const { rows: userRows } = await client.query(
      'SELECT full_name, birthdate FROM public.users WHERE id = $1',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = userRows[0];

    await client.query('BEGIN');

    const result = await finalizeRequestFromData(client, userId, {
      idDocumentPath,
      proofOfPaymentPath,
      delivery_address: req.body.delivery_address,
      full_name: user.full_name,
      birthdate: user.birthdate,
      last_sy_attended: req.body.last_sy_attended,
      course: req.body.course,
      documentsJson: req.body.documents,
      special_request: req.body.special_request // ✅ add this line
    });

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Document request submitted successfully.',
      request_id: result.requestId,
      total_cost: result.totalCost,
      alumni_fee_applied: result.alumniFee > 0,
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in createClientRequest:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
};

const saveDraftRequest = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;

    let {
      delivery_address,
      full_name,
      last_sy_attended,
      course,
      documents,
      special_request
    } = req.body;

    delivery_address = clean(delivery_address);
    full_name = clean(full_name);
    course = clean(course);
    special_request = special_request ? clean(special_request) : null;

    let idDocumentPath = null;
    let proofOfPaymentPath = null;

    if (req.files?.id_document) {
      idDocumentPath = req.files.id_document[0].path;
    }
    if (req.files?.proof_of_payment) {
      proofOfPaymentPath = req.files.proof_of_payment[0].path;
    }

    // Validate and store JSON
    let documentsToStore = null;
    if (documents) {
      try {
        documentsToStore = typeof documents === 'string'
          ? JSON.stringify(JSON.parse(documents)) // ensure valid JSON
          : JSON.stringify(documents);
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid JSON in documents field.' });
      }
    }

    const insertDraft = await client.query(
      `INSERT INTO services.document_request_drafts (
        user_id, delivery_address, full_name,
        last_sy_attended, course,
        id_document_path, proof_of_payment, documents, special_request
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        userId,
        delivery_address,
        full_name,
        last_sy_attended,
        course,
        idDocumentPath,
        proofOfPaymentPath,
        documentsToStore,
        special_request
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Draft saved successfully.',
      draft_id: insertDraft.rows[0].id,
    });

  } catch (err) {
    console.error('Error in saveDraftRequest:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
};

const submitDraftRequest = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const draftId = req.params.id;

    await client.query('BEGIN');

    // Fetch the draft
    const draftResult = await client.query(
      `SELECT * FROM services.document_request_drafts WHERE id = $1 AND user_id = $2`,
      [draftId, userId]
    );

    if (draftResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Draft not found' });
    }

    const draft = draftResult.rows[0];

    // Validate files
    if (!draft.proof_of_payment) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Proof of payment is missing in the draft.' });
    }

    if (!draft.id_document_path) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'ID document is missing in the draft.' });
    }

    // Fetch user's full_name and birthdate
    const { rows: userRows } = await client.query(
      'SELECT full_name, birthdate FROM public.users WHERE id = $1',
      [userId]
    );

    if (userRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = userRows[0];

    // Finalize request
    const result = await finalizeRequestFromData(client, userId, {
      idDocumentPath: draft.id_document_path,
      proofOfPaymentPath: draft.proof_of_payment,
      delivery_address: draft.delivery_address,
      full_name: user.full_name,
      birthdate: user.birthdate,
      last_sy_attended: draft.last_sy_attended,
      course: draft.course,
      documentsJson: draft.documents,
      special_request: draft.special_request ?? null // ✅ support optional field
    });

    // Delete the draft after successful submission
    await client.query(`DELETE FROM services.document_request_drafts WHERE id = $1`, [draftId]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Draft submitted successfully.',
      request_id: result.requestId,
      total_cost: result.totalCost,
      alumni_fee_applied: result.alumniFee > 0,
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in submitDraftRequest:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
};

const updateDraftRequest = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const draftId = req.params.id;

    const draftResult = await client.query(
      `SELECT * FROM services.document_request_drafts WHERE id = $1 AND user_id = $2`,
      [draftId, userId]
    );

    if (draftResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Draft not found.' });
    }

    const draft = draftResult.rows[0];

    const delivery_address = clean(req.body.delivery_address ?? draft.delivery_address);
    const full_name = clean(req.body.full_name ?? draft.full_name);
    const last_sy_attended = req.body.last_sy_attended ?? draft.last_sy_attended;
    const course = clean(req.body.course ?? draft.course);
    const special_request = clean(req.body.special_request ?? draft.special_request);

    let documents = req.body.documents ?? draft.documents;

    let documentsToStore;
    try {
      documentsToStore = typeof documents === 'string'
        ? JSON.stringify(JSON.parse(documents))
        : JSON.stringify(documents);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid JSON in documents field.' });
    }

    let idDocumentPath = draft.id_document_path;
    let proofOfPaymentPath = draft.proof_of_payment;

    if (req.files?.id_document) {
      idDocumentPath = req.files.id_document[0].path;
    }

    if (req.files?.proof_of_payment) {
      proofOfPaymentPath = req.files.proof_of_payment[0].path;
    }

    await client.query(
      `UPDATE services.document_request_drafts
       SET delivery_address = $1,
           full_name = $2,
           last_sy_attended = $3,
           course = $4,
           documents = $5,
           id_document_path = $6,
           proof_of_payment = $7,
           special_request = $8,
           updated_at = NOW()
       WHERE id = $9 AND user_id = $10`,
      [
        delivery_address,
        full_name,
        last_sy_attended,
        course,
        documentsToStore,
        idDocumentPath,
        proofOfPaymentPath,
        special_request,
        draftId,
        userId
      ]
    );

    res.status(200).json({ success: true, message: 'Draft updated successfully.' });

  } catch (err) {
    console.error('Error in updateDraftRequest:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
};


module.exports = {
  getDrafts,
  createClientRequest,
  saveDraftRequest,
  getDraftById,
  submitDraftRequest,
  updateDraftRequest
};