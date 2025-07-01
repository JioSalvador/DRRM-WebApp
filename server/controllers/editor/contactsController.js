const pool = require('../../db');
const logAction = require('../../utils/logAction');

const getAllContacts = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM contents.contacts");
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getContactById = async (req, res) => {
  try {
    const { contactId } = req.params;
    const contactDoc = await pool.query("SELECT * FROM contents.contacts WHERE id = $1", [contactId]);

    if (contactDoc.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found!' });
    }

    res.status(200).json(contactDoc.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const createContact = async (req, res) => {
  const { name, contact } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO contents.contacts (name, contact) VALUES ($1, $2) RETURNING *',
      [name, contact]
    );

    const newContact = result.rows[0];

    // Optional: only log if user info exists
    if (req.user?.id && req.user?.role) {
      await logAction({
        userId: req.user.id,
        role: req.user.role,
        action: 'created_contact',
        targetType: 'contact',
        targetId: newContact.id,
        description: `Created new contact: ${newContact.name} (${newContact.contact})`
      });
    }

    res.status(200).json(newContact);
  } catch (err) {
    console.error("🔥 createContact error:", err.message);
    res.status(400).json({ error: err.message });
  }
};

const updateContactById = async (req, res) => {
  const { contactId } = req.params;
  const { name, contact } = req.body;

  try {
    const exists = await pool.query(
      'SELECT * FROM contents.contacts WHERE id = $1',
      [contactId]
    );

    if (exists.rows.length === 0) {
      return res.status(404).json({ message: 'Contact not found!' });
    }

    const current = exists.rows[0];
    const updatedName = name ?? current.name;
    const updatedContact = contact ?? current.contact;

    const result = await pool.query(
      'UPDATE contents.contacts SET name = $1, contact = $2 WHERE id = $3 RETURNING *',
      [updatedName, updatedContact, contactId]
    );

    const updated = result.rows[0];

    await logAction({
      userId: req.user.id,
      role: req.user.role,
      action: 'updated_contact',
      targetType: 'contact',
      targetId: contactId,
      description: `Updated contact ID ${contactId} to: ${updated.name} (${updated.contact})`
    });

    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteContactById = async (req, res) => {
  const { contactId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM contents.contacts WHERE id = $1 RETURNING *',
      [contactId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found!' });
    }

    const deleted = result.rows[0];

    await logAction({
      userId: req.user.id,
      role: req.user.role,
      action: 'deleted_contact',
      targetType: 'contact',
      targetId: contactId,
      description: `Deleted contact: ${deleted.name} (${deleted.contact})`
    });

    res.status(200).json({ message: 'Contact deleted successfully!' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  getAllContacts,
  getContactById,
  createContact,
  updateContactById,
  deleteContactById,
};