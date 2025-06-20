const express = require('express');
const router = express.Router();
const {
  getNews,
  getNewsById,
  createNews,
  updateNewsById,
  deleteNewsById,
  upload
} = require('../../controllers/editor/newsController');
const verifyToken = require('../../middleware/verifyToken');
const roleGuard = require('../../middleware/roleGuard');

router.get('/', getNews);
router.get('/:newsId', getNewsById);

router.use(verifyToken, roleGuard('editor'));

router.post('/', upload.single('image'), createNews);
router.put('/:newsId', upload.single('image'), updateNewsById);
router.delete('/:newsId', deleteNewsById);

module.exports = router;