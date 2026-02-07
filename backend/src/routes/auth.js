const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const verifyToken = require('../middleware/authMiddleware');

const SECRET_KEY = process.env.JWT_SECRET || 'your_super_secret_key_123';

// Register
router.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Please provide all fields' });
    }

    const hashedPassword = bcrypt.hashSync(password, 8);

    const sql = "INSERT INTO users (username, email, password) VALUES (?,?,?)";

    db.run(sql, [username, email, hashedPassword], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            return res.status(500).json({ error: err.message });
        }

        // Auto-login (optional) or just return success
        const token = jwt.sign({ id: this.lastID }, SECRET_KEY, { expiresIn: '24h' });

        res.status(201).json({
            message: 'User registered successfully',
            token: token,
            user: { id: this.lastID, username, email }
        });
    });
});

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";

    db.get(sql, [email], (err, user) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '24h' });

        res.status(200).json({
            message: 'Login successful',
            token: token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    });
});

// Update User Profile and Settings
router.put('/me', verifyToken, (req, res) => {
    const { username, email, password, profile_pic, notify_push, notify_email, theme, default_view, language } = req.body;
    const userId = req.userId;

    // Build update query dynamically
    let sql = "UPDATE users SET username = COALESCE(?, username), email = COALESCE(?, email), profile_pic = COALESCE(?, profile_pic), notify_push = COALESCE(?, notify_push), notify_email = COALESCE(?, notify_email), theme = COALESCE(?, theme), default_view = COALESCE(?, default_view), language = COALESCE(?, language)";
    let params = [username, email, profile_pic, notify_push, notify_email, theme, default_view, language];

    if (password) {
        const hashedPassword = bcrypt.hashSync(password, 8);
        sql += ", password = ?";
        params.push(hashedPassword);
    }

    sql += " WHERE id = ?";
    params.push(userId);

    db.run(sql, params, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Settings updated successfully' });
    });
});

// Get User Profile and Settings
router.get('/me', verifyToken, (req, res) => {
    const sql = "SELECT id, username, email, created_at, profile_pic, notify_push, notify_email, theme, default_view, language FROM users WHERE id = ?";

    db.get(sql, [req.userId], (err, user) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.status(200).json({ user });
    });
});

// Forgot Password Placeholder
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    // In a real app, you'd check DB and send an email
    res.json({ message: 'If this email is registered, a reset link has been sent.' });
});

// Reset Password Placeholder
router.post('/reset-password', (req, res) => {
    const { email, newPassword } = req.body;
    // In a real app, you'd verify a token and update the DB
    res.json({ message: 'Password has been reset successfully.' });
});

module.exports = router;
