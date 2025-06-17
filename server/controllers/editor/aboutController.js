const pool = require('../../db');

const getAbout = async (req, res) => {
    try{
        const result = await pool.query('SELECT * FROM contents.about ORDER BY id');
        res.status(200).json(result.rows);
    }catch(err){
        res.status(400).json({error: err.message});
    }
};
const getAboutById = async (req, res) => {
    try{
        const { aboutId } = req.params;

        const result = await pool.query(
            'SELECT * FROM contents.about WHERE id = $1', 
            [aboutId]
        );

        if (result.rows.length === 0){
            res.status(404).json({message: 'That section does not exist!'})
        }

        res.status(200).json(result.rows[0]);
    }catch(err){
        res.status(400).json({error: err.message});
    }
}
const updateAbout = async (req, res) => {
    try{
        const { id } = req.params;
        const { content } = req.body;
        const date = new Date();

        const result = await pool.query(
            'UPDATE contents.about SET content = $1, date = $2 WHERE id = $3 RETURNING *',
            [content, date, id]
        )

        if (result.rows.length === 0){
            return res.status(404).json({error: err.message});
        }

        res.status(200).json(result.rows[0]);
    }catch(err){
        res.status(400).json({error: err.message});
    }
};

module.exports = {
    updateAbout,
    getAbout,
    getAboutById,
}