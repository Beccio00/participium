"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLoggedIn = isLoggedIn;
exports.requireAdmin = requireAdmin;
// isLoggedIn checks if the user is authenticated
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated())
        return next();
    return res.status(401).json({
        error: "Unauthorized",
        message: "You don't have the right to access this resource"
    });
}
function requireAdmin(req, res, next) {
    const authReq = req;
    if (!authReq.isAuthenticated || !authReq.isAuthenticated()) {
        return res.status(401).json({
            error: "Unauthorized",
            message: "Authentication required"
        });
    }
    if (!authReq.user || authReq.user.role !== 'ADMINISTRATOR') {
        return res.status(403).json({
            error: "Forbidden",
            message: "Administrator privileges required"
        });
    }
    return next();
}
