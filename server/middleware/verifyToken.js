const jwt = require('jsonwebtoken');
const db = require('../db'); // adjust if you use another db client

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader && authHeader.split(' ')[1];
  const tokenFromCookie = req.cookies?.token;

  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized - no token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yoursecretkey');

    if (!decoded?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized - invalid token." });
    }

    // Fetch user from DB (make sure your public.users table has a 'role' column)
    const { rows } = await db.query(
      `SELECT id, email, role FROM public.users WHERE id = $1`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    req.user = rows[0]; // 👈 attach user to request
    next();
  } catch (err) {
    console.error("Error in verifyToken:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = verifyToken;