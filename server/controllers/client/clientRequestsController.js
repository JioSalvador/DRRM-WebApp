const pool = require('../../db');
const path = require('path');
const fs = require('fs');

const createClientRequest = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const { delivery_address } = req.body;

    // Parse document items from JSON string
    const documentItems = JSON.parse(req.body.documents || '[]');

    if (!req.files || !req.files.id_document) {
      return res.status(400).json({ success: false, message: 'ID document is required.' });
    }

    const idDocumentPath = req.files.id_document[0].path;

    await client.query('BEGIN');

    // Check alumni status
    const userResult = await client.query(
      `SELECT alumni_expiration FROM public.users WHERE id = $1`,
      [userId]
    );

    const now = new Date();
    const alumniExpiration = userResult.rows[0]?.alumni_expiration;
    const isAlumni = alumniExpiration && new Date(alumniExpiration) > now;

    // Calculate total cost
    let totalCost = 0;

    for (const doc of documentItems) {
      const { rows } = await client.query(
        `SELECT unit_price FROM services.document_types WHERE name = $1 AND is_active = TRUE`,
        [doc.type]
      );

      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: `Invalid document type: ${doc.type}` });
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

    // Insert into document_requests
    const insertRequest = await client.query(
      `INSERT INTO services.document_requests (
        user_id, id_document_path,
        delivery_address, is_alumni_member, alumni_fee, total_cost
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [userId, idDocumentPath, delivery_address, isAlumni, alumniFee, totalCost]
    );

    const requestId = insertRequest.rows[0].id;

    // Insert into document_request_items
    for (const doc of documentItems) {
      await client.query(
        `INSERT INTO services.document_request_items (
          request_id, document_type, quantity, unit_price
        ) VALUES ($1, $2, $3, $4)`,
        [requestId, doc.type, doc.quantity, doc.unit_price]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Document request submitted successfully.',
      request_id: requestId,
      total_cost: totalCost,
      alumni_fee_applied: alumniFee > 0,
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in createClientRequest:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
};

module.exports = {
  createClientRequest,
};