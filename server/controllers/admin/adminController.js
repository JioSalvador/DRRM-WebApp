const pool = require('../../db');
const generateRequestPdf = require('../../utils/pdfGenerator');
const path = require('path');

const getAllRequests = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        dr.id,
        dr.user_id,
        u.email,
        dr.full_name,
        dr.course,
        dr.last_sy_attended,
        dr.status,
        dr.total_cost,
        dr.created_at
      FROM services.document_requests dr
      JOIN public.users u ON dr.user_id = u.id
      ORDER BY dr.created_at DESC
    `);
    res.status(200).json({ success: true, requests: rows });
  } catch (err) {
    console.error('Error in getAllRequests:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
const terminateRequest = async (req, res) => {
  const { requestId } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ success: false, message: 'Termination reason is required.' });
  }

  try {
    await pool.query(
      `UPDATE services.document_requests
       SET status = 'terminated',
           is_terminated = TRUE,
           termination_reason = $1,
           termination_date = NOW()
       WHERE id = $2`,
      [reason, requestId]
    );

    res.status(200).json({ success: true, message: 'Request terminated successfully.' });
  } catch (err) {
    console.error('Error in terminateRequest:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const markPaymentValidated = async (req, res) => {
  const { requestId } = req.params;

  try {
    await pool.query(
      `UPDATE services.document_requests
       SET payment_validated = TRUE,
           payment_validated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [requestId]
    );

    res.status(200).json({ success: true, message: 'Payment marked as validated.' });
  } catch (err) {
    console.error('Error in markPaymentValidated:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const markForDelivery = async (req, res) => {
  const { requestId } = req.params;

  try {
    await pool.query(
      `UPDATE services.document_requests
       SET status = 'out_for_delivery',
           is_out_for_delivery = TRUE,
           out_for_delivery_at = NOW()
       WHERE id = $1`,
      [requestId]
    );

    res.status(200).json({ success: true, message: 'Request marked as out for delivery.' });
  } catch (err) {
    console.error('Error in markForDelivery:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
const revertPaymentValidation = async (req, res) => {
  const { requestId } = req.params;

  try {
    await pool.query(
      `UPDATE services.document_requests
       SET payment_validated = FALSE,
           payment_validated_at = NULL
       WHERE id = $1`,
      [requestId]
    );

    res.status(200).json({ success: true, message: 'Payment validation reverted.' });
  } catch (err) {
    console.error('Error in revertPaymentValidation:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const revertDeliveryStatus = async (req, res) => {
  const { requestId } = req.params;

  try {
    await pool.query(
      `UPDATE services.document_requests
       SET status = 'pending',
           is_out_for_delivery = FALSE,
           out_for_delivery_at = NULL
       WHERE id = $1`,
      [requestId]
    );

    res.status(200).json({ success: true, message: 'Delivery status reverted to pending.' });
  } catch (err) {
    console.error('Error in revertDeliveryStatus:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const generatePdfForRequest = async (req, res) => {
  const { requestId } = req.params;

  try {
    // Fetch request info
    const { rows } = await pool.query(`
      SELECT 
        dr.id,
        dr.full_name,
        dr.delivery_address,
        dr.birthdate,
        dr.alumni_fee,
        dr.total_cost,
        dr.id_document_path,
        dr.proof_of_payment, 
        u.full_name AS user_full_name,
        u.birthdate AS user_birthdate
      FROM services.document_requests dr
      JOIN public.users u ON u.id = dr.user_id
      WHERE dr.id = $1
    `, [requestId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const request = rows[0];

    const itemsResult = await pool.query(
      `SELECT document_type AS type, quantity, unit_price 
       FROM services.document_request_items 
       WHERE request_id = $1`,
      [requestId]
    );

    const outputPath = path.join(__dirname, '..', '..', 'generated-pdfs', `request-${requestId}.pdf`);
    const idPath = request.id_document_path;
    const proofPath = request.proof_of_payment;


    await generateRequestPdf({
      fullName: request.full_name,
      address: request.delivery_address,
      birthdate: request.birthdate,
      documents: itemsResult.rows,
      alumniFeeApplied: request.alumni_fee > 0,
      total: request.total_cost,
      outputPath,
      idPath,
      proofPath
    });

    res.status(200).json({ success: true, message: 'PDF generated.', path: outputPath });

  } catch (err) {
    console.error('Error in generatePdfForRequest:', err);
    res.status(500).json({ success: false, message: 'Failed to generate PDF.' });
  }
};


module.exports = {
  terminateRequest,
  markPaymentValidated,
  markForDelivery,
  getAllRequests,
  revertPaymentValidation,
  revertDeliveryStatus,
  generatePdfForRequest,
};