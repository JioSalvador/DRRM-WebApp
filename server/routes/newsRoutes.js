const express = require('express');
const router = express.Router();
const { getNews, getNewsById, createNews, updateNewsById, deleteNewsById, upload } = require('../controllers/newsController.js');

//router.get('', (req, res) => {});
router.get('/', getNews);
router.get('/:newsId', getNewsById);
router.post('/', upload.single('image'), createNews);
router.put('/:newsId', upload.single('image'), updateNewsById);
router.delete('/:newsId', deleteNewsById);

module.exports = router;