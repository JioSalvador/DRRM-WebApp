const pool = require('../db');

const logAction = async ({ userId, role, action, targetType, targetId, description }) => {
  try {
    console.log('⚙️ Logging action:', { userId, role, action, targetType, targetId, description });

    const result = await pool.query(`
      INSERT INTO public.user_action_logs 
      (user_id, role, action, target_type, target_id, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [userId, role, action, targetType, targetId, description]);

    console.log('✅ Action log inserted with ID:', result.rows[0].id);
  } catch (err) {
    console.error('❌ Failed to log action:', err);
  }
};

module.exports = logAction;