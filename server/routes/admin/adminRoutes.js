const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/verifyToken');
const roleGuard = require('../../middleware/roleGuard');
const { markPaymentValidated, markForDelivery, terminateRequest} = require('../../controllers/admin/adminController');

router.post('/:requestId/mark-payment-validated', verifyToken, roleGuard('admin'), markPaymentValidated);
router.post('/:requestId/mark-for-delivery', verifyToken, roleGuard('admin'), markForDelivery);
router.post('/:requestId/terminate-request', verifyToken, roleGuard('admin'), terminateRequest);

module.exports = router;