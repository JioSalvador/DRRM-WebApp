const express = require('express')
const router = express.Router();

const {  getAllFAQ, createFAQ, updateFAQ, deleteFAQ, } = require('../controllers/faqController.js');

//router.get('', (req, res) => {});
router.get('/', getAllFAQ);
router.post('/', createFAQ);
router.put('/:faqId', updateFAQ);
router.delete('/:faqId', deleteFAQ);

module.exports = router;