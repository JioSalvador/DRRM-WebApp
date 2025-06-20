const pool = require('../../db');

const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role, is_verified, is_banned,
              is_alumni_member, alumni_expiration, created_at
       FROM public.users
       ORDER BY created_at DESC`
    );

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT id, full_name, email, role, is_verified, is_banned,
              is_alumni_member, alumni_expiration, created_at
       FROM public.users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found!' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      full_name,
      email,
      role,
      is_banned,
      is_alumni_member,
      alumni_expiration
    } = req.body;

    // Check if user exists
    const check = await pool.query('SELECT * FROM public.users WHERE id = $1', [userId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'User not found!' });
    }

    const current = check.rows[0];

    const updatedUser = await pool.query(
      `UPDATE public.users SET
        full_name = $1,
        email = $2,
        role = $3,
        is_banned = $4,
        is_alumni_member = $5,
        alumni_expiration = $6
      WHERE id = $7
      RETURNING id, full_name, email, role, is_banned, is_alumni_member, alumni_expiration`,
      [
        full_name ?? current.full_name,
        email ?? current.email,
        role ?? current.role,
        is_banned ?? current.is_banned,
        is_alumni_member ?? current.is_alumni_member,
        alumni_expiration ?? current.alumni_expiration,
        userId
      ]
    );

    res.status(200).json({
      message: 'User updated successfully!',
      user: updatedUser.rows[0]
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      'DELETE FROM public.users WHERE id = $1 RETURNING id, full_name, email',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found!' });
    }

    res.status(200).json({
      message: 'User deleted successfully!',
      deleted: result.rows[0]
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
}