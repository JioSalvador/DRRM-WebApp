const express = require('express');
const { login, signup, checkAuth, verifyEmail, changePassword, verifyLoginOtp, changeEmail, confirmChangeEmail, logout, getMe } = require('../../controllers/general/authController.js');
const verifyToken = require('../../middleware/verifyToken.js');
const router = express.Router();

//router.get('', (req, res) => {});
router.get('/check-auth', verifyToken, checkAuth);
router.get('/verify-email', verifyEmail);
router.get('/confirm-change-email', confirmChangeEmail);
router.get('/me', verifyToken, getMe);

router.post('/login', login);
router.post('/signup', signup);
router.post('/change-password', verifyToken, changePassword);
router.post('/verify-login-otp', verifyLoginOtp);
router.post('/change-email', verifyToken, changeEmail);
router.post('/logout', verifyToken, logout);


module.exports = router;