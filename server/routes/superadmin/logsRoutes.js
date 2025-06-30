const express = require('express');
const router = express.Router();
const { getAllLogs } = require('../../controllers/superadmin/logsController');
const verifyToken = require('../../middleware/verifyToken');
const roleGuard = require('../../middleware/roleGuard');

router.get('/', verifyToken, roleGuard('superadmin'), getAllLogs);

module.exports = router;