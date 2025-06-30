const pool = require('../../db');

console.log("📦 superadmin.js loaded");

// GET /api/logs?role=admin&user_id=5&limit=50
const getAllLogs = async (req, res) => {
  try {
    const { role, user_id, limit = 100 } = req.query;
    const values = [];

    // Join user logs with user names
    let query = `
      SELECT 
        l.*, 
        u.full_name AS name  -- ✅ Alias full_name as "name" for frontend
      FROM 
        public.user_action_logs l
      LEFT JOIN 
        public.users u ON l.user_id = u.id
      WHERE 1=1
    `;

    if (role) {
      values.push(role);
      query += ` AND l.role = $${values.length}`;
    }

    if (user_id) {
      values.push(user_id);
      query += ` AND l.user_id = $${values.length}`;
    }

    values.push(limit);
    query += ` ORDER BY l.created_at DESC LIMIT $${values.length}`;

    const { rows } = await pool.query(query, values);
    res.status(200).json(rows);
  } catch (err) {
    console.error('❌ Error fetching logs:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAllLogs,
};