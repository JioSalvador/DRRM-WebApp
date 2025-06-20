const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/verifyToken');
const upload = require('../../middleware/multerSetup');
const { createClientRequest, saveDraftRequest, getDrafts, getDraftById, submitDraftRequest, updateDraftRequest } = require('../../controllers/client/clientRequestsController');

router.get('/my-drafts', verifyToken, getDrafts);
router.get('/draft/:id', verifyToken, getDraftById);

// 📝 Save a draft (ID document optional)
router.post('/save-draft',
  verifyToken,
  upload.fields([
    { name: 'id_document', maxCount: 1 },
    { name: 'proof_of_payment', maxCount: 1 },
  ]),
  saveDraftRequest
);


router.patch(
  '/update-draft/:id',
  verifyToken,
  upload.fields([
    { name: 'id_document', maxCount: 1 },
    { name: 'proof_of_payment', maxCount: 1 },
  ]),
  updateDraftRequest
);

// ✅ Submit a new document request (direct)
router.post('/request-document',
  verifyToken,
  upload.fields([
    { name: 'id_document', maxCount: 1 },
    { name: 'proof_of_payment', maxCount: 1 }, // <- This was missing
  ]),
  createClientRequest
);


// 📤 Submit a previously saved draft
router.post('/submit-draft/:id', verifyToken, upload.fields([
  { name: 'id_document', maxCount: 1 },
]), submitDraftRequest); // ✅ Add this

module.exports = router;