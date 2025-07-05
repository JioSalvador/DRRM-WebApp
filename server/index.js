const cron = require('node-cron');
const cleanupExpiredRequests = require('./utils/cleanupExpiredRequests.js'); // adjust if in subfolder
const express = require('express');
const app = express();
const pool = require('./db.js');
const cookieParser = require('cookie-parser');
const cors = require('cors'); // ✅ Added CORS
const path = require('path');

const PORT = process.env.PORT || 3000;

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/generated-pdfs', express.static(path.join(__dirname, 'generated-pdfs')));

// ✅ Enable CORS for frontend on port 5500 (e.g., Live Server)
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Test database connection
async function testDBConnection() {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log("✅ Database connected successfully at:", result.rows[0].now);
    } catch (err) {
        console.error("❌ Database connection error:", err.message);
    }
}
testDBConnection();

const verifyToken = require('./middleware/verifyToken');
const roleGuard = require('./middleware/roleGuard');

app.get('/test-superadmin', verifyToken, roleGuard('superadmin'), (req, res) => {
  res.json({ message: 'You are a verified Superadmin!', user: req.user });
});


// Routes
const newsRoutes = require('./routes/editor/newsRoutes.js');
const aboutRoutes = require('./routes/editor/aboutRoutes.js');
const faqRoutes = require('./routes/editor/faqRoutes.js');
const authRoutes = require('./routes/general/authRoutes.js');
const contactsRoutes = require('./routes/editor/contactsRoutes.js');
const clientRoutes = require('./routes/client/clientRequestRoutes.js');
const adminRoutes = require('./routes/admin/adminRoutes.js');
const userRoutes = require('./routes/superadmin/userRoutes.js');
const itemRoutes = require('./routes/superadmin/itemRoutes.js');
const logsRoutes = require('./routes/superadmin/logsRoutes.js');
const calendarRoutes = require('./routes/editor/calendarRoutes.js');

// Root route
app.get('/', (req, res) => {
    res.send('Hello World');
});

// Mount routes
app.use('/news', newsRoutes);
app.use('/about', aboutRoutes);
app.use('/faq', faqRoutes);
app.use('/contacts', contactsRoutes);
app.use('/auth', authRoutes);
app.use('/calendar', calendarRoutes);
app.use('/admin', adminRoutes);
app.use('/client', clientRoutes);
app.use('/userRoutes', userRoutes);
app.use('/logsRoutes', logsRoutes);
app.use('/itemRoutes', itemRoutes);

// Run cleanup every day at midnight
cron.schedule('0 0 * * *', () => {
  console.log('[CRON] Running daily cleanup for expired document requests...');
  cleanupExpiredRequests();
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port: ${PORT}`);
});