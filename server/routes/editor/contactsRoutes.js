const express = require('express');
const router = express.Router();
const { getAllContacts, createContact, updateContactById, deleteContactById, getContactById } = require('../../controllers/editor/contactsController.js');
const verifyToken = require('../../middleware/verifyToken'); // or your actual path
const roleGuard = require('../../middleware/roleGuard');     // or your actual path

router.get('/', getAllContacts);
router.get('/:contactId', getContactById);
router.post('/', verifyToken, roleGuard('editor'), createContact);
router.put('/:contactId', verifyToken, roleGuard('editor'), updateContactById);
router.delete('/:contactId', verifyToken, roleGuard('editor'), deleteContactById);

module.exports = router;