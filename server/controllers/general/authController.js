const pool = require('../../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const transporter = require('../../utils/emailService');
const crypto = require('crypto');
const logAction = require('../../utils/logAction');

// SIGNUP
const signup = async (req, res) => {
    try {
        const { email, full_name, birthdate, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const role = 'client';

        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'A user with that email already exists!' });
        }

        const result = await pool.query(
            'INSERT INTO users (email, full_name, birthdate, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [email, full_name, birthdate, hashedPassword, role]
        );

        const user = result.rows[0];

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'yoursecretkey', {
            expiresIn: '15m',
        });

        const verificationLink = `http://localhost:3000/auth/verify-email?token=${token}`;
        await transporter.sendMail({
            from: '"DRRM" <no-reply@drrm.com>',
            to: email,
            subject: 'Verify Your Email',
            html: `
                <p>Welcome to DRRM! Please click the link below to verify your email:</p>
                <a href="${verificationLink}">${verificationLink}</a>
                <p>This link will expire soon for your security.</p>`
        });

        res.status(200).json({ message: 'Signup successful! Please check your email to verify your account.' });

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// VERIFY EMAIL
const verifyEmail = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).send('Verification token missing.');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yoursecretkey');
        const userId = decoded.id;

        const result = await pool.query(
            'UPDATE users SET is_verified = true WHERE id = $1 RETURNING id, email, full_name, role',
            [userId]
        );

        const user = result.rows[0];

        const newToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'yoursecretkey',
            { expiresIn: '1h' }
        );

        res.cookie('token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 3600000,
        });

        res.status(200).send('Email verified successfully! You are now logged in.');
    } catch (err) {
        res.status(400).send('Invalid or expired token.');
    }
};

// LOGIN
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await pool.query(
            'UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3',
            [otp, expiresAt, user.id]
        );

        await transporter.sendMail({
            from: '"DRRM" <no-reply@drrm.com>',
            to: user.email,
            subject: 'Your Login OTP',
            html: `<p>Your OTP is <b>${otp}</b>. It will expire in 10 minutes.</p>`
        });

        res.status(200).json({ message: 'OTP sent to email', email: user.email });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// VERIFY LOGIN OTP
const verifyLoginOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const otpMatches = user.otp_code &&
            user.otp_code.toString().trim() === otp.toString().trim();

        if (!otpMatches) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (new Date() > new Date(user.otp_expires_at)) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        // Clear OTP and mark verified
        await pool.query(
            'UPDATE users SET is_verified = true, otp_code = NULL, otp_expires_at = NULL WHERE email = $1',
            [email]
        );

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'yoursecretkey',
            { expiresIn: '8h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 3600000,
        });

        console.log('✅ Cookie sent with token');

        // Log admin/editor login
        if (user.role === 'admin' || user.role === 'editor') {
            await logAction({
                userId: user.id,
                role: user.role,
                action: `${user.role}_login`,
                targetType: 'user',
                targetId: user.id,
                description: `${user.full_name} logged in.`
            });
        }

        delete user.password;

        // ✅ ✅ ✅ Send token back to frontend
        res.status(200).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
            }
        });

    } catch (err) {
        console.error('Error in verifyLoginOtp:', err.message);
        res.status(400).json({ message: err.message });
    }
};

// LOGOUT
const logout = async (req, res) => {
    const { id, role, full_name } = req.user;

    try {
        if (role === 'admin' || role === 'editor') {
        await logAction({
            userId: id,
            role,
            action: `${role}_logout`,
            targetType: 'user',
            targetId: id,
            description: `${full_name || 'An editor'} logged out.`
        });
        }

        res.clearCookie('token', {
            httpOnly: true,
            sameSite: 'Strict',
            secure: process.env.NODE_ENV === 'production',
        });

        res.status(200).json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Logout failed.' });
    }
};

// CHECK AUTH
const checkAuth = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, full_name, role FROM users WHERE id = $1',
            [req.userId]
        );

        const user = result.rows[0];
        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found!' });
        }

        res.status(200).json({ success: true, user });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// CHANGE PASSWORD
const changePassword = async (req, res) => {
    const userId = req.userId;
    const { password, newPassword } = req.body;

    if (!password || !newPassword) {
        return res.status(400).json({ message: 'Current and new password are required.' });
    }

    try {
        const result = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Incorrect current password.' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, userId]);

        res.status(200).json({ message: 'Password changed successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// CHANGE EMAIL
const changeEmail = async (req, res) => {
    const userId = req.userId;
    const { newEmail } = req.body;

    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        return res.status(400).json({ message: 'Invalid email address.' });
    }

    try {
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [newEmail]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Email already in use.' });
        }

        const token = jwt.sign(
            { id: userId, newEmail },
            process.env.JWT_SECRET || 'yoursecretkey',
            { expiresIn: '15m' }
        );

        const link = `http://localhost:3000/auth/confirm-change-email?token=${token}`;

        await transporter.sendMail({
            from: '"DRRM" <no-reply@drrm.com>',
            to: newEmail,
            subject: 'Confirm Your New Email',
            html: `
                <p>Please click the link below to confirm your new email address:</p>
                <a href="${link}">${link}</a>
                <p>This link expires in 15 minutes.</p>`
        });

        res.status(200).json({ message: 'Verification email sent to new address.' });

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// CONFIRM EMAIL CHANGE
const confirmChangeEmail = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).send('Verification token missing.');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yoursecretkey');
        const { id, newEmail } = decoded;

        await pool.query('UPDATE users SET email = $1 WHERE id = $2', [newEmail, id]);
        res.status(200).send('Email address changed successfully.');
    } catch (err) {
        res.status(400).send('Invalid or expired token.');
    }
};

const getMe = async (req, res) => {
  try {
    const { id } = req.user;

    const result = await pool.query(`
      SELECT id, full_name, email, birthdate, role, is_alumni_member
      FROM public.users
      WHERE id = $1
    `, [id]);

    console.log("🧪 Cookie received in /me route:", req.cookies);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = result.rows[0];
    res.status(200).json({ success: true, user });

  } catch (error) {
    console.error('Error in /auth/me:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// DELETE ACCOUNT (unimplemented)
const deleteAccount = async (req, res) => {
    try {
        // Implementation placeholder
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

module.exports = {
    signup,
    login,
    logout,
    checkAuth,
    changePassword,
    changeEmail,
    deleteAccount,
    verifyLoginOtp,
    verifyEmail,
    confirmChangeEmail,
    getMe
};