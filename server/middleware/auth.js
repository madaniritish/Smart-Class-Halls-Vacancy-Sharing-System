const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // 1. Check HTTP-only cookie first
    let token = req.cookies?.token;

    // 2. Fall back to header 'x-auth-token'
    if (!token) {
        token = req.header('x-auth-token');
    }

    // 3. Fall back to Authorization Bearer header
    if (!token && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
            token = parts[1];
        }
    }

    // Check if no token found
    if (!token) {
        return res.status(401).json({ message: 'No authentication token provided, authorization denied.' });
    }

    // Verify token
    try {
        const secret = process.env.JWT_SECRET || 'campusflow_super_secret_jwt_key_2026';
        const decoded = jwt.verify(token, secret);
        req.user = decoded.user;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token is invalid or has expired. Please log in again.' });
    }
};
