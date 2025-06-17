const express = require('express');
const router = express.Router();

const { updateAbout, getAbout, getAboutById } = require('../../controllers/editor/aboutController.js');

//router.get('', (req, res) => {});
router.get('/', getAbout);
router.get('/:aboutId', getAboutById);
router.put('/:aboutId', updateAbout);

module.exports = router;