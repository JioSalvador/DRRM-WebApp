const pool = require('../../db');

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

module.exports = {
  terminateRequest,
  markPaymentValidated,
  markForDelivery,
};