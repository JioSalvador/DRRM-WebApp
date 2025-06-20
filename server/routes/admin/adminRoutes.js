const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/verifyToken');
const roleGuard = require('../../middleware/roleGuard');
const { markPaymentValidated, markForDelivery, terminateRequest, getAllRequests, revertPaymentValidation, revertDeliveryStatus, generatePdfForRequest } = require('../../controllers/admin/adminController');

router.use(verifyToken, roleGuard('admin'));

router.get('/view-all', getAllRequests)
router.post('/:requestId/mark-payment-validated', markPaymentValidated);
router.post('/:requestId/mark-for-delivery', markForDelivery);
router.post('/:requestId/terminate-request', terminateRequest);
router.post('/:requestId/revert-delivery', revertDeliveryStatus);
router.post('/:requestId/revert-validation', revertPaymentValidation);
router.post('/:requestId/generate-pdf', generatePdfForRequest);

module.exports = router;