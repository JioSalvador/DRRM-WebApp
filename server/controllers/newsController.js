const multer = require('multer');
//const path = require('path');
const pool = require('../db');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

const getNews = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM contents.news ORDER BY date DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const getNewsById = async (req, res) => {
    try {
        const { newsId } = req.params;

        const newsDoc = await pool.query('SELECT * FROM contents.news WHERE id = $1', [newsId]);

        if (newsDoc.rows.length === 0) {
            return res.status(404).json({ error: 'News article not found!' });
        }

        res.status(200).json(newsDoc.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const createNews = async (req, res) => {
    const { title, content, author } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const date = new Date()
    try {
        const result = await pool.query(
        'INSERT INTO contents.news (title, content, author, date, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [title, content, author, date, imageUrl]
        );
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const updateNewsById = async (req, res) => {
    try {
        const { newsId } = req.params;
        const { title, content, author } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

        const existing = await pool.query('SELECT * FROM contents.news WHERE id = $1', [newsId]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'News article not found!' });
        }

        const current = existing.rows[0];

        const updatedTitle = title ?? current.title;
        const updatedContent = content ?? current.content;
        const updatedAuthor = author ?? current.author;
        const updatedImageUrl = imageUrl ?? current.image_url;

        const result = await pool.query(
            `UPDATE contents.news 
             SET title = $1, content = $2, author = $3, image_url = $4 
             WHERE id = $5 RETURNING *`,
            [updatedTitle, updatedContent, updatedAuthor, updatedImageUrl, newsId]
        );

        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};


const deleteNewsById = async (req, res) => {
    try {
        const { newsId } = req.params;

        const result = await pool.query('DELETE FROM contents.news WHERE id = $1 RETURNING *', [newsId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'News article not found!' });
        }

        res.status(200).json({ message: 'News article deleted successfully!' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

module.exports = {
    getNews,
    getNewsById,
    createNews,
    updateNewsById,
    deleteNewsById,
    upload,
};