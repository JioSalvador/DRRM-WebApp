const express = require('express');
const router = express.Router();

const { updateAbout, getAbout, getAboutById } = require('../../controllers/editor/aboutController.js');

const verifyToken = require('../../middleware/verifyToken');
const roleGuard = require('../../middleware/roleGuard');

router.get('/', getAbout);
router.get('/:id', getAboutById);

router.put('/:id', verifyToken, roleGuard('editor'), updateAbout);

module.exports = router;