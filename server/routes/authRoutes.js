const express = require('express');
const { login, signup, checkAuth, verifyEmail, changePassword, verifyLoginOtp, changeEmail, confirmChangeEmail } = require('../controllers/authController.js');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

//router.get('', (req, res) => {});
router.get('/check-auth', verifyToken, checkAuth);
router.get('/verify-email', verifyEmail);
router.get('/confirm-change-email', confirmChangeEmail);
router.post('/login', login);
router.post('/signup', signup);
router.post('/change-password', verifyToken, changePassword);
router.post('/verify-login-otp', verifyLoginOtp);
router.post('/change-email', verifyToken, changeEmail);

module.exports = router;