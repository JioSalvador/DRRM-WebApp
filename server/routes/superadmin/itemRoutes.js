const express = require('express');
const {
  addItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem
} = require('../../controllers/superadmin/itemController');
const verifyToken = require('../../middleware/verifyToken');
const roleGuard = require('../../middleware/roleGuard');
const router = express.Router();

// ✅ PUBLIC route: get only active items for the frontend
router.get('/get-all-items', getAllItems); // Make sure getAllItems filters is_active=true

// ✅ Protected routes for superadmins only
router.use(verifyToken); // Sets req.user for roleGuard to work

router.get('/get-item/:itemId', roleGuard('superadmin'), getItemById);
router.post('/add-item', roleGuard('superadmin'), addItem);
router.put('/update-item/:itemId', roleGuard('superadmin'), updateItem);
router.delete('/delete-item/:itemId', roleGuard('superadmin'), deleteItem);

module.exports = router;