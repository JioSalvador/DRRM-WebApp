const pool = require('../db');

const getAllFAQ = async (req, res) => {
try{
    const result = await pool.query('SELECT * FROM contents.faq ORDER BY id');
    res.status(200).json(result.rows);
}catch(err){
    res.status(400).json({error: err.message});
}};

const createFAQ = async (req, res) => {
    try{
        const { question, content } = req.body;
        const date = new Date();
        
        const result = await pool.query(
            'INSERT INTO contents.faq (date, question, content) VALUES ($1, $2, $3) RETURNING *',
            [date, question, content]
        );
        res.status(200).json(result.rows[0]);
    }catch(err){
        res.status(400).json({error: err.message});
    }
}

const updateFAQ = async (req, res) => {
    try {
        const { faqId } = req.params;
        const { question, content } = req.body;

        const fields = [];
        const values = [];
        let index = 1;

        if (question !== undefined) {
            fields.push(`question = $${index++}`);
            values.push(question);
        }

        if (content !== undefined) {
            fields.push(`content = $${index++}`);
            values.push(content);
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: "No valid fields to update." });
        }

        values.push(faqId);
        const query = `UPDATE contents.faq SET ${fields.join(", ")} WHERE id = $${index} RETURNING *`;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "FAQ not found!" });
        }

        res.status(200).json(result.rows[0]);

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};


const deleteFAQ = async (req, res) =>{
    try{
        const { faqId } = req.params
        const result = await pool.query(
            'DELETE FROM contents.faq WHERE id = $1 RETURNING *', 
            [faqId]
        );
        
        if (result.rows.length === 0){
            return res.status(404).json({error: 'Question not found!'});
        }

        res.status(200).json({ message: 'Question deleted successfully!'})
    }catch(err){
        res.status(400).json({error: err.message});
    }
}

module.exports = {
    getAllFAQ,
    createFAQ,
    updateFAQ,
    deleteFAQ,
}