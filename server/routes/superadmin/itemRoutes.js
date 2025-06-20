const express = require('express');
const { addItem, getAllItems, getItemById, updateItem, deleteItem } = require('../../controllers/superadmin/userController');
const verifyToken = require('../../middleware/verifyToken');
const roleGuard = require('../../middleware/roleGuard');
const router = express.Router();

router.use(verifyToken, roleGuard('Superadmin'));

//router.get('', (req, res) => {});
router.get('/get-all-items', getAllItems);
router.get('/get-item/:itemId', getItemById);

router.post('/add-item', addItem);
router.put('/update-item/:itemId', updateItem);

router.delete('/delete-item/:itemId', deleteItem);

module.exports = router;