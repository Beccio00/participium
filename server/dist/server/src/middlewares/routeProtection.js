"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLoggedIn = isLoggedIn;
exports.requireAdmin = requireAdmin;
exports.requireCitizen = requireCitizen;
exports.requirePublicRelations = requirePublicRelations;
exports.requireTechnicalStaff = requireTechnicalStaff;
const utils_1 = require("../utils");
const UserDTO_1 = require("../interfaces/UserDTO");
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated())
        return next();
    throw new utils_1.UnauthorizedError("You don't have the right to access this resource");
}
function requireAdmin(req, res, next) {
    const authReq = req;
    if (!authReq.isAuthenticated || !authReq.isAuthenticated()) {
        throw new utils_1.UnauthorizedError("Authentication required");
    }
    if (!authReq.user || authReq.user.role !== 'ADMINISTRATOR') {
        throw new utils_1.ForbiddenError("Administrator privileges required");
    }
    return next();
}
function requireCitizen(req, res, next) {
    const authReq = req;
    if (!authReq.isAuthenticated || !authReq.isAuthenticated()) {
        throw new utils_1.UnauthorizedError("Authentication required");
    }
    if (!authReq.user || authReq.user.role !== 'CITIZEN') {
        throw new utils_1.ForbiddenError("Only citizens can create reports");
    }
    return next();
}
function requirePublicRelations(req, res, next) {
    const authReq = req;
    if (!authReq.isAuthenticated || !authReq.isAuthenticated()) {
        throw new utils_1.UnauthorizedError("Authentication required");
    }
    if (!authReq.user || authReq.user.role !== 'PUBLIC_RELATIONS') {
        throw new utils_1.ForbiddenError("Public relations officer privileges required");
    }
    return next();
}
function requireTechnicalStaff(req, res, next) {
    const authReq = req;
    if (!authReq.isAuthenticated || !authReq.isAuthenticated()) {
        throw new utils_1.UnauthorizedError("Authentication required");
    }
    if (!authReq.user) {
        throw new utils_1.UnauthorizedError("Authentication required");
    }
    if (!UserDTO_1.TECHNICAL_ROLES.includes(authReq.user.role)) {
        throw new utils_1.ForbiddenError("Technical staff privileges required");
    }
    return next();
}
