const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const transporter = require('../utils/emailService');
const crypto = require('crypto');

//LOGIN, LOGOUT, AND SIGNUP
const signup = async (req, res) => {
    try {
        const { email, username, display_name, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const role = 'Client';

        // Check if email already exists
        const userExists = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'A user with that email already exists!' });
        }

        // Check if username already exists
        const nameExists = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        if (nameExists.rows.length > 0) {
            return res.status(400).json({ message: 'A user with that name already exists!' });
        }

        // Check for special characters in username
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({ message: 'Username must contain only letters, numbers, and underscores.' });
        }

        // Insert new user
        const result = await pool.query(
            'INSERT INTO users (email, username, display_name, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [email, username, display_name, hashedPassword, role]
        );

        const user = result.rows[0];

        // Generate email verification token
        const jwt = require('jsonwebtoken');

        const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'yoursecretkey',
        { expiresIn: '15m' } // expires in 15 minutes
        );

        // Send verification email
        const verificationLink = `http://localhost:3000/auth/verify-email?token=${token}`;
        await transporter.sendMail({
            from: '"DRRM" <no-reply@drrm.com>',
            to: email,
            subject: 'Verify Your Email',
            html: `<p>Welcome to DRRM! Please click the link below to verify your email:</p>
                   <a href="${verificationLink}">${verificationLink}</a>
                   <p>This link will expire soon for your security.</p>`
        });

        res.status(200).json({ message: 'Signup successful! Please check your email to verify your account.' });

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
const verifyEmail = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).send('Verification token missing.');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yoursecretkey');
        const userId = decoded.id;

        // Mark user as verified
        const result = await pool.query(
            'UPDATE users SET is_verified = true WHERE id = $1 RETURNING id, email, username, role',
            [userId]
        );

        const user = result.rows[0];

        // Create a new JWT token
        const newToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'yoursecretkey',
            { expiresIn: '1h' }
        );

        // Set it as HTTP-only cookie
        res.cookie('token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 3600000 // 1 hour
        });

        // Redirect or confirm
        res.status(200).send('Email verified successfully! You are now logged in.');

    } catch (err) {
        res.status(400).send('Invalid or expired token.');
    }
};
const login = async (req, res) => {
    const { identifier, password } = req.body;

    try {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

        const result = await pool.query(
            `SELECT * FROM users WHERE ${isEmail ? 'email' : 'username'} = $1`,
            [identifier]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const matchingPasswords = await bcrypt.compare(password, user.password);

        if (!matchingPasswords) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Step 1: Generate OTP and expiration
        const otp = Math.floor(100000 + Math.random() * 900000);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await pool.query(
            'UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3',
            [otp, expiresAt, user.id]
        );

        // Step 2: Send email
        await transporter.sendMail({
            from: '"DRRM" <no-reply@drrm.com>',
            to: user.email,
            subject: 'Your Login OTP',
            html: `<p>Your OTP is <b>${otp}</b>. It will expire in 10 minutes.</p>`
        });

        res.status(200).json({
            message: 'OTP sent to email',
            email: user.email // for client to display confirmation
        });

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
const verifyLoginOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
    const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
    );

    const user = result.rows[0];

    if (!user || user.otp_code !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
        return res.status(400).json({ message: 'OTP has expired' });
    }

    // Clear OTP and mark user as verified
    await pool.query(
        'UPDATE users SET is_verified = true, otp_code = NULL, otp_expires_at = NULL WHERE email = $1',
        [email]
    );

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'yoursecretkey',
        { expiresIn: '1h' }
    );

    // Set token as an HTTP-only cookie
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true if using HTTPS
        sameSite: 'Strict',
        maxAge: 3600000, // 1 hour
    });

    // Return user info without password
    delete user.password;

    res.status(200).json({
        user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        },
    });

    } catch (err) {
    res.status(400).json({ message: err.message });
    }
};

//VERIFY USER SESSION
const checkAuth = async (req, res)=>{
    try{
        const result = await pool.query(
            'SELECT id, email, role FROM users WHERE id = $1',
            [req.userId]
        );
        const user = result.rows[0];

        if (!user){
            return res.status(400).json({success: false, message: 'User not found!'});
        }

        res.status(200).json({success: true, user});
    }catch(err){
        res.status(400).json({success: false, message: err.message});
    }
};

//FUNCTIONS FOR USERS IN GENERAL
const changePassword = async (req, res) => {
    const userId = req.userId; // populated by verifyToken middleware
    const { password, newPassword } = req.body;

    if (!password || !newPassword) {
        return res.status(400).json({ message: 'Current and new password are required.' });
    }

    try {
        // Get current hashed password
        const result = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Compare old password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password.' });
        }

        // Hash new password and update
        const hashed = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, userId]);

        res.status(200).json({ message: 'Password changed successfully.' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};
const changeEmail = async (req, res) => {
    const userId = req.userId; // you get this from auth middleware
    const { newEmail } = req.body;

    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        return res.status(400).json({ message: 'Invalid email address.' });
    }

    try {
        // Optional: Check if email is already taken
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [newEmail]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Email already in use.' });
        }

        // Generate verification token with newEmail inside
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
            html: `<p>Please click the link below to confirm your new email address:</p>
                   <a href="${link}">${link}</a>
                   <p>This link expires in 15 minutes.</p>`
        });

        res.status(200).json({ message: 'Verification email sent to new address.' });

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
const confirmChangeEmail = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).send('Verification token missing.');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yoursecretkey');
        const { id, newEmail } = decoded;

        await pool.query(
            'UPDATE users SET email = $1 WHERE id = $2',
            [newEmail, id]
        );

        res.status(200).send('Email address changed successfully.');
    } catch (err) {
        res.status(400).send('Invalid or expired token.');
    }
};
const changeTitle = async (req, res) => {
    try{

    }catch(err){
        res.status(400).json({error: err.message});
    }
}
const deleteAccount = async (req, res) => {
    try{

    }catch(err){
        res.status(400).json({error: err.message});
    }
}


module.exports = {
    signup,
    login,
    checkAuth,
    changePassword,
    changeEmail,
    changeTitle,
    deleteAccount,
    verifyLoginOtp,
    verifyEmail,
    confirmChangeEmail,
};