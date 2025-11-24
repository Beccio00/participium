"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const reportController_1 = require("../../../src/controllers/reportController");
const reportService = __importStar(require("../../../src/services/reportService"));
// Mock del service layer
jest.mock("../../../src/services/reportService");
const mockCreateReportService = reportService.createReport;
const mockGetApprovedReportsService = reportService.getApprovedReports;
describe("reportController", () => {
    let mockReq;
    let mockRes;
    beforeEach(() => {
        mockReq = {
            body: {},
            user: null,
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        jest.clearAllMocks();
    });
    describe("createReport", () => {
        const validReportData = {
            title: "Broken streetlight",
            description: "The streetlight on Via Roma is not working",
            category: "PUBLIC_LIGHTING",
            latitude: 45.0703,
            longitude: 7.6869,
            isAnonymous: false,
            photos: [
                {
                    id: 1,
                    url: "https://example.com/photo.jpg",
                    filename: "streetlight.jpg"
                }
            ]
        };
        const validUser = {
            id: 1,
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            role: "CITIZEN",
            telegramUsername: null,
            emailNotificationsEnabled: true,
        };
        it("should create report successfully with valid data", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = validReportData;
            mockReq.user = validUser;
            const mockCreatedReport = Object.assign(Object.assign({ id: 1 }, validReportData), { userId: validUser.id, status: "PENDING_APPROVAL", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
            mockCreateReportService.mockResolvedValue(mockCreatedReport);
            yield (0, reportController_1.createReport)(mockReq, mockRes);
            expect(mockCreateReportService).toHaveBeenCalledWith({
                title: validReportData.title,
                description: validReportData.description,
                category: validReportData.category,
                latitude: validReportData.latitude,
                longitude: validReportData.longitude,
                isAnonymous: validReportData.isAnonymous,
                photos: validReportData.photos,
                userId: validUser.id,
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Report created successfully",
                id: mockCreatedReport.id,
            });
        }));
        it("should return 401 if user is not authenticated", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = validReportData;
            mockReq.user = null;
            yield (0, reportController_1.createReport)(mockReq, mockRes);
            expect(mockCreateReportService).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Unauthorized",
                message: "User not logged in",
            });
        }));
        it("should return 401 if user is undefined", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = validReportData;
            mockReq.user = undefined;
            yield (0, reportController_1.createReport)(mockReq, mockRes);
            expect(mockCreateReportService).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Unauthorized",
                message: "User not logged in",
            });
        }));
        it("should return 400 if title is missing", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = Object.assign(Object.assign({}, validReportData), { title: undefined });
            mockReq.user = validUser;
            yield (0, reportController_1.createReport)(mockReq, mockRes);
            expect(mockCreateReportService).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Bad Request",
                message: "Missing required fields",
            });
        }));
        it("should return 400 if description is missing", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = Object.assign(Object.assign({}, validReportData), { description: undefined });
            mockReq.user = validUser;
            yield (0, reportController_1.createReport)(mockReq, mockRes);
            expect(mockCreateReportService).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Bad Request",
                message: "Missing required fields",
            });
        }));
        it("should return 400 if category is missing", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = Object.assign(Object.assign({}, validReportData), { category: undefined });
            mockReq.user = validUser;
            yield (0, reportController_1.createReport)(mockReq, mockRes);
            expect(mockCreateReportService).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Bad Request",
                message: "Missing required fields",
            });
        }));
        it("should return 400 if latitude is missing", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = Object.assign(Object.assign({}, validReportData), { latitude: undefined });
            mockReq.user = validUser;
            yield (0, reportController_1.createReport)(mockReq, mockRes);
            expect(mockCreateReportService).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Bad Request",
                message: "Missing required fields",
            });
        }));
        it("should return 400 if longitude is missing", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = Object.assign(Object.assign({}, validReportData), { longitude: undefined });
            mockReq.user = validUser;
            yield (0, reportController_1.createReport)(mockReq, mockRes);
            expect(mockCreateReportService).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Bad Request",
                message: "Missing required fields",
            });
        }));
        it("should return 400 if photos are missing", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = Object.assign(Object.assign({}, validReportData), { photos: undefined });
            mockReq.user = validUser;
            yield (0, reportController_1.createReport)(mockReq, mockRes);
            expect(mockCreateReportService).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Bad Request",
                message: "Missing required fields",
            });
        }));
        it("should accept latitude and longitude as 0 (valid coordinates)", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = Object.assign(Object.assign({}, validReportData), { latitude: 0, longitude: 0 });
            mockReq.user = validUser;
            const mockCreatedReport = Object.assign(Object.assign({ id: 1 }, mockReq.body), { userId: validUser.id, status: "PENDING_APPROVAL", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
            mockCreateReportService.mockResolvedValue(mockCreatedReport);
            yield (0, reportController_1.createReport)(mockReq, mockRes);
            expect(mockCreateReportService).toHaveBeenCalledWith({
                title: validReportData.title,
                description: validReportData.description,
                category: validReportData.category,
                latitude: 0,
                longitude: 0,
                isAnonymous: validReportData.isAnonymous,
                photos: validReportData.photos,
                userId: validUser.id,
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
        }));
        it("should handle service layer errors", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = validReportData;
            mockReq.user = validUser;
            const serviceError = new Error("Database connection failed");
            mockCreateReportService.mockRejectedValue(serviceError);
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            yield (0, reportController_1.createReport)(mockReq, mockRes);
            expect(consoleSpy).toHaveBeenCalledWith("Error creating report", serviceError);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Internal Server Error",
                message: "Unable to create report",
            });
            consoleSpy.mockRestore();
        }));
        it("should create anonymous report", () => __awaiter(void 0, void 0, void 0, function* () {
            const anonymousReportData = Object.assign(Object.assign({}, validReportData), { isAnonymous: true });
            mockReq.body = anonymousReportData;
            mockReq.user = validUser;
            const mockCreatedReport = Object.assign(Object.assign({ id: 1 }, anonymousReportData), { userId: validUser.id, status: "PENDING_APPROVAL", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
            mockCreateReportService.mockResolvedValue(mockCreatedReport);
            yield (0, reportController_1.createReport)(mockReq, mockRes);
            expect(mockCreateReportService).toHaveBeenCalledWith({
                title: anonymousReportData.title,
                description: anonymousReportData.description,
                category: anonymousReportData.category,
                latitude: anonymousReportData.latitude,
                longitude: anonymousReportData.longitude,
                isAnonymous: true,
                photos: anonymousReportData.photos,
                userId: validUser.id,
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
        }));
        it("should handle different report categories", () => __awaiter(void 0, void 0, void 0, function* () {
            const categories = [
                "WATER_SUPPLY_DRINKING_WATER",
                "ARCHITECTURAL_BARRIERS",
                "SEWER_SYSTEM",
                "PUBLIC_LIGHTING",
                "WASTE",
                "ROAD_SIGNS_TRAFFIC_LIGHTS",
                "ROADS_URBAN_FURNISHINGS",
                "PUBLIC_GREEN_AREAS_PLAYGROUNDS",
                "OTHER"
            ];
            for (const category of categories) {
                const reportWithCategory = Object.assign(Object.assign({}, validReportData), { category });
                mockReq.body = reportWithCategory;
                mockReq.user = validUser;
                const mockCreatedReport = Object.assign(Object.assign({ id: 1 }, reportWithCategory), { userId: validUser.id, status: "PENDING_APPROVAL", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
                mockCreateReportService.mockResolvedValue(mockCreatedReport);
                yield (0, reportController_1.createReport)(mockReq, mockRes);
                expect(mockCreateReportService).toHaveBeenCalledWith({
                    title: reportWithCategory.title,
                    description: reportWithCategory.description,
                    category: category,
                    latitude: reportWithCategory.latitude,
                    longitude: reportWithCategory.longitude,
                    isAnonymous: reportWithCategory.isAnonymous,
                    photos: reportWithCategory.photos,
                    userId: validUser.id,
                });
                jest.clearAllMocks();
            }
        }));
        it("should handle valid Turin coordinates", () => __awaiter(void 0, void 0, void 0, function* () {
            // Coordinate reali di Torino
            const turinReportData = Object.assign(Object.assign({}, validReportData), { latitude: 45.0703, longitude: 7.6869 // Longitudine di Torino
             });
            mockReq.body = turinReportData;
            mockReq.user = validUser;
            const mockCreatedReport = Object.assign(Object.assign({ id: 1 }, turinReportData), { userId: validUser.id, status: "PENDING_APPROVAL", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
            mockCreateReportService.mockResolvedValue(mockCreatedReport);
            yield (0, reportController_1.createReport)(mockReq, mockRes);
            expect(mockCreateReportService).toHaveBeenCalledWith({
                title: turinReportData.title,
                description: turinReportData.description,
                category: turinReportData.category,
                latitude: 45.0703,
                longitude: 7.6869,
                isAnonymous: turinReportData.isAnonymous,
                photos: turinReportData.photos,
                userId: validUser.id,
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
        }));
    });
    describe("getReports", () => {
        it("should return approved reports successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockReports = [
                {
                    id: 1,
                    title: "Streetlight issue",
                    description: "Broken streetlight",
                    category: "PUBLIC_LIGHTING",
                    latitude: 45.0703,
                    longitude: 7.6869,
                    status: "ASSIGNED",
                    user: {
                        first_name: "John",
                        last_name: "Doe",
                        email: "john.doe@example.com"
                    }
                },
                {
                    id: 2,
                    title: "Pothole",
                    description: "Large pothole on street",
                    category: "ROADS_AND_URBAN_FURNISHINGS",
                    latitude: 45.0704,
                    longitude: 7.6870,
                    status: "IN_PROGRESS",
                    user: {
                        first_name: "Jane",
                        last_name: "Smith",
                        email: "jane.smith@example.com"
                    }
                }
            ];
            mockGetApprovedReportsService.mockResolvedValue(mockReports);
            yield (0, reportController_1.getReports)(mockReq, mockRes);
            expect(mockGetApprovedReportsService).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockReports);
        }));
        it("should return empty array when no reports exist", () => __awaiter(void 0, void 0, void 0, function* () {
            mockGetApprovedReportsService.mockResolvedValue([]);
            yield (0, reportController_1.getReports)(mockReq, mockRes);
            expect(mockGetApprovedReportsService).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith([]);
        }));
        it("should handle service layer errors", () => __awaiter(void 0, void 0, void 0, function* () {
            const serviceError = new Error("Database query failed");
            mockGetApprovedReportsService.mockRejectedValue(serviceError);
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            yield (0, reportController_1.getReports)(mockReq, mockRes);
            expect(consoleSpy).toHaveBeenCalledWith("Error during report retrieval:", serviceError);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "InternalServerError",
                message: "Error during report retrieval",
            });
            consoleSpy.mockRestore();
        }));
    });
});
