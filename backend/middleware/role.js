// Role-based authorization middleware
// Restricts access to routes based on user roles
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // Check if user exists and has required role
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Insufficient privileges",
            });
        }
        next();
    };
};

module.exports = authorizeRoles;