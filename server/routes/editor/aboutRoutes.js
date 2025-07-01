const express = require('express');
const router = express.Router();

const { updateAbout, getAbout, getAboutById } = require('../../controllers/editor/aboutController.js');

// 🛡️ Middleware
const verifyToken = require('../../middleware/verifyToken');
const roleGuard = require('../../middleware/roleGuard');

// ✅ Public routes (viewing content)
router.get('/', getAbout);
router.get('/:id', getAboutById);

// ✅ Protected route (editing content - only Editors allowed)
router.put('/:id', verifyToken, roleGuard('editor'), updateAbout);

module.exports = router;