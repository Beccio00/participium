"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routeProtection_1 = require("../../../src/middleware/routeProtection");
describe("routeProtection", () => {
    let mockReq;
    let mockRes;
    let mockNext;
    beforeEach(() => {
        mockReq = {};
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        mockNext = jest.fn();
    });
    describe("isLoggedIn", () => {
        it("should call next if user is authenticated", () => {
            mockReq.isAuthenticated = jest.fn().mockReturnValue(true);
            (0, routeProtection_1.isLoggedIn)(mockReq, mockRes, mockNext);
            expect(mockReq.isAuthenticated).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });
        it("should return 401 if user is not authenticated", () => {
            mockReq.isAuthenticated = jest.fn().mockReturnValue(false);
            (0, routeProtection_1.isLoggedIn)(mockReq, mockRes, mockNext);
            expect(mockReq.isAuthenticated).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Unauthorized",
                message: "You don't have the right to access this resource",
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
        it("should return 401 if isAuthenticated is undefined", () => {
            mockReq.isAuthenticated = undefined;
            (0, routeProtection_1.isLoggedIn)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Unauthorized",
                message: "You don't have the right to access this resource",
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
        it("should return 401 if isAuthenticated is null", () => {
            mockReq.isAuthenticated = null;
            (0, routeProtection_1.isLoggedIn)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Unauthorized",
                message: "You don't have the right to access this resource",
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
});
