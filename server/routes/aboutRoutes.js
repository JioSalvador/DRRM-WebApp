const express = require('express');
const router = express.Router();

const { updateAbout, getAbout } = require('../controllers/aboutController.js');

//router.get('', (req, res) => {});
router.get('/', getAbout);
router.put('/:id', updateAbout);

module.exports = router;