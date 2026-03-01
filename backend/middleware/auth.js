const jwt = require('jsonwebtoken');

// JWT authentication middleware
// Verifies access tokens from Authorization header
const verifyToken = (req, res, next) => {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization;

    // Check if token exists and follows Bearer format
    if (!authHeader?.startsWith('Bearer')) {
        return res.status(401).json({
            message: "Unauthorized, token missing",
        });
    }

    // Extract token from 'Bearer <token>' format
    const token = authHeader.split(' ')[1];
    
    try {
        // Verify token using JWT secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user information to request object
        req.user = { id: decoded.id, role: decoded.role };
        next();
    } catch (error) {
        // Handle invalid or expired tokens
        return res.status(401).json({
            message: "Unauthorized, invalid or expired token",
        });
    }
};

module.exports = verifyToken;