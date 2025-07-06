const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/verifyToken');
const upload = require('../../middleware/multerSetup');
const { createClientRequest, saveDraftRequest, getDrafts, getDraftById, submitDraftRequest, updateDraftRequest , getMyRequests, deleteDraftRequestById, receiveRequestAndSetAlumni} = require('../../controllers/client/clientRequestsController');

router.get('/my-drafts', verifyToken, getDrafts);
router.get('/draft/:id', verifyToken, getDraftById);
router.get('/my-requests', verifyToken, getMyRequests);


router.put('/receive/:requestId', verifyToken, receiveRequestAndSetAlumni);
router.post('/save-draft',
  verifyToken,
  (req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    console.log('Incoming Content-Type:', contentType);
    next();
  },
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

router.post('/request-document',
  verifyToken,
  upload.fields([
    { name: 'id_document', maxCount: 1 },
    { name: 'proof_of_payment', maxCount: 1 },
  ]),
  createClientRequest
);


router.post('/submit-draft/:id', verifyToken, upload.fields([
  { name: 'id_document', maxCount: 1 },
]), submitDraftRequest);

router.delete('/draft/:id', verifyToken, deleteDraftRequestById);

module.exports = router;