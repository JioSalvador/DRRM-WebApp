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

router.get('/get-all-items', getAllItems);

router.use(verifyToken);

router.get('/get-item/:itemId', roleGuard('superadmin'), getItemById);
router.post('/add-item', roleGuard('superadmin'), addItem);
router.put('/update-item/:itemId', roleGuard('superadmin'), updateItem);
router.delete('/delete-item/:itemId', roleGuard('superadmin'), deleteItem);

module.exports = router;