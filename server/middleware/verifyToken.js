const jwt = require('jsonwebtoken');
const db = require('../db');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader && authHeader.split(' ')[1];
  const tokenFromCookie = req.cookies?.token;

  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized - No token provided." });
  }

  try {
    // ✅ Log the raw token
    console.log("🔐 Authorization header:", authHeader);
    console.log("🔐 Extracted token:", tokenFromHeader);
    console.log("🔐 Token received:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yoursecretkey');

    if (!decoded?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized - Invalid token payload." });
    }

    const { rows } = await db.query(
      `SELECT id, email, role FROM public.users WHERE id = $1`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ success: false, message: "Token expired. Please log in again." });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ success: false, message: "Invalid token." });
    }

    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

module.exports = verifyToken;