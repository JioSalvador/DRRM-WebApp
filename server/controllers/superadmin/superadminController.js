const pool = require('../../db');

const banUser = async (req, res) => {
    try{

    }catch(err){
        res.status(400).json({error: err.message});
    }
}
const deleteUser = async (req, res) => {
    try{
        const { userId } = req.params;

        const result = await pool.query(
            'DELETE FROM public.users WHERE id = $1 RETURNING *',
            [userId]
        );

        if (result.rows.length === 0){
            return res.status(404).json({error: 'User not found!'});
        };

        res.status(200).json({message: 'User deleted successfully!'});
    }catch(err){
        res.status(400).json({error: err.message});
    }
}
const displayLogs = async (req, res) => {
    try{

    }catch(err){
        res.status(400).json({error: err.message});
    }
}
const updateUserRole = async (req, res) => {
    try{

    }catch(err){
        res.status(400).json({error: err.message});
    }
}

module.exports = {
    banUser,
    deleteUser,
    displayLogs,
    updateUserRole,
}