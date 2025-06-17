const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const tokenFromHeader = authHeader && authHeader.split(' ')[1];
    const tokenFromCookie = req.cookies && req.cookies.token;

    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized - no token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yoursecretkey');

        if (!decoded) {
            return res.status(401).json({ success: false, message: "Unauthorized - invalid token." });
        }

        req.userId = decoded.id; // ✅ Fix: assign to userId
        next();
    } catch (err) {
        console.log("Error in verifyToken", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = verifyToken;