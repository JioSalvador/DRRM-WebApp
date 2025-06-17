const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/verifyToken');
const upload = require('../../middleware/multerSetup');
const { createClientRequest } = require('../../controllers/client/clientRequestsController');

// Handle multipart/form-data with two files
router.post(
  '/request-document',
  verifyToken,
  upload.fields([
    { name: 'id_document', maxCount: 1 },
  ]),
  createClientRequest
);

module.exports = router;
