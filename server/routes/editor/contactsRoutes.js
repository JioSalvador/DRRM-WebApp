const express = require('express');
const router = express.Router();

const { getAllContacts, createContact, updateContactById, deleteContactById, getContactById } = require('../../controllers/editor/contactsController.js');

router.get('/', getAllContacts);
router.get('/:contactId', getContactById)
router.post('/', createContact);
router.put('/:contactId', updateContactById);
router.delete('/:contactId', deleteContactById)

module.exports = router;