const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/verifyToken');
const roleGuard = require('../../middleware/roleGuard');
const { getAllUsers, getUserById, updateUser, deleteUser } = require('../../controllers/superadmin/userController');

router.use(verifyToken, roleGuard('superadmin'));

router.get('/', getAllUsers);
router.get('/:userId', getUserById);
router.put('/:userId/update', updateUser);
router.delete('/:userId/delete', deleteUser);

module.exports = router;