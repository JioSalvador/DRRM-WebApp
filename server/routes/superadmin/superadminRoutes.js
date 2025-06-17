const express = require('express');
const { banUser, deleteUser, displayLogs, updateUserRole } = require('../../controllers/superadmin/superadminController');
const router = express.Router();

//router.get('', (req, res) => {});
router.delete('/delete-user/:userId', deleteUser);

module.exports = router;