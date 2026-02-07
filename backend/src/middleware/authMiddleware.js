const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'your_super_secret_key_123';

const verifyToken = (req, res, next) => {
    const tokenHeader = req.headers['authorization'];

    if (!tokenHeader) {
        return res.status(403).json({ error: 'No token provided' });
    }

    const token = tokenHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(403).json({ error: 'Malformed token' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            console.error('JWT Verification Error:', err.message);
            return res.status(401).json({ error: 'Failed to authenticate token' });
        }

        // Save user id to request for use in other routes
        req.userId = decoded.id;
        next();
    });
};

module.exports = verifyToken;
