"use strict";
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
const reportService_1 = require("../../../src/services/reportService");
// Mock the Prisma client
const mockCreate = jest.fn();
const mockFindMany = jest.fn();
jest.mock("../../../src/utils/prismaClient", () => ({
    prisma: {
        report: {
            create: (...args) => mockCreate(...args),
            findMany: (...args) => mockFindMany(...args),
        },
    },
}));
describe("reportService", () => {
    beforeEach(() => {
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
            userId: 1,
            photos: [
                {
                    id: 1,
                    url: "https://example.com/photo.jpg",
                    filename: "streetlight.jpg"
                }
            ]
        };
        it("should create a report with valid data", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockCreatedReport = Object.assign(Object.assign({ id: 1 }, validReportData), { status: "PENDING_APPROVAL", createdAt: new Date(), updatedAt: new Date(), user: {
                    id: 1,
                    first_name: "John",
                    last_name: "Doe",
                    email: "john.doe@example.com",
                }, photos: [
                    {
                        id: 1,
                        url: "https://example.com/photo.jpg",
                        filename: "streetlight.jpg",
                        reportId: 1
                    }
                ] });
            mockCreate.mockResolvedValue(mockCreatedReport);
            const result = yield (0, reportService_1.createReport)(validReportData);
            expect(mockCreate).toHaveBeenCalledWith({
                data: {
                    title: validReportData.title,
                    description: validReportData.description,
                    category: validReportData.category,
                    latitude: validReportData.latitude,
                    longitude: validReportData.longitude,
                    isAnonymous: validReportData.isAnonymous,
                    status: "PENDING_APPROVAL",
                    userId: validReportData.userId,
                    photos: {
                        create: [
                            {
                                url: "https://example.com/photo.jpg",
                                filename: "streetlight.jpg"
                            }
                        ]
                    },
                },
                include: {
                    user: true,
                    photos: true,
                },
            });
            expect(result).toEqual(mockCreatedReport);
        }));
        it("should create anonymous report", () => __awaiter(void 0, void 0, void 0, function* () {
            const anonymousReportData = Object.assign(Object.assign({}, validReportData), { isAnonymous: true });
            const mockCreatedReport = Object.assign(Object.assign({ id: 1 }, anonymousReportData), { status: "PENDING_APPROVAL", createdAt: new Date(), updatedAt: new Date(), user: {
                    id: 1,
                    first_name: "John",
                    last_name: "Doe",
                    email: "john.doe@example.com",
                }, photos: [] });
            mockCreate.mockResolvedValue(mockCreatedReport);
            const result = yield (0, reportService_1.createReport)(anonymousReportData);
            expect(mockCreate).toHaveBeenCalledWith({
                data: {
                    title: anonymousReportData.title,
                    description: anonymousReportData.description,
                    category: anonymousReportData.category,
                    latitude: anonymousReportData.latitude,
                    longitude: anonymousReportData.longitude,
                    isAnonymous: true,
                    status: "PENDING_APPROVAL",
                    userId: anonymousReportData.userId,
                    photos: {
                        create: [
                            {
                                url: "https://example.com/photo.jpg",
                                filename: "streetlight.jpg"
                            }
                        ]
                    },
                },
                include: {
                    user: true,
                    photos: true,
                },
            });
            expect(result).toEqual(mockCreatedReport);
        }));
        it("should create report with multiple photos", () => __awaiter(void 0, void 0, void 0, function* () {
            const reportWithMultiplePhotos = Object.assign(Object.assign({}, validReportData), { photos: [
                    {
                        id: 1,
                        url: "https://example.com/photo1.jpg",
                        filename: "photo1.jpg"
                    },
                    {
                        id: 2,
                        url: "https://example.com/photo2.jpg",
                        filename: "photo2.jpg"
                    }
                ] });
            const mockCreatedReport = Object.assign(Object.assign({ id: 1 }, reportWithMultiplePhotos), { status: "PENDING_APPROVAL", createdAt: new Date(), updatedAt: new Date(), user: {
                    id: 1,
                    first_name: "John",
                    last_name: "Doe",
                    email: "john.doe@example.com",
                }, photos: [
                    {
                        id: 1,
                        url: "https://example.com/photo1.jpg",
                        filename: "photo1.jpg",
                        reportId: 1
                    },
                    {
                        id: 2,
                        url: "https://example.com/photo2.jpg",
                        filename: "photo2.jpg",
                        reportId: 1
                    }
                ] });
            mockCreate.mockResolvedValue(mockCreatedReport);
            const result = yield (0, reportService_1.createReport)(reportWithMultiplePhotos);
            expect(mockCreate).toHaveBeenCalledWith({
                data: {
                    title: reportWithMultiplePhotos.title,
                    description: reportWithMultiplePhotos.description,
                    category: reportWithMultiplePhotos.category,
                    latitude: reportWithMultiplePhotos.latitude,
                    longitude: reportWithMultiplePhotos.longitude,
                    isAnonymous: reportWithMultiplePhotos.isAnonymous,
                    status: "PENDING_APPROVAL",
                    userId: reportWithMultiplePhotos.userId,
                    photos: {
                        create: [
                            {
                                url: "https://example.com/photo1.jpg",
                                filename: "photo1.jpg"
                            },
                            {
                                url: "https://example.com/photo2.jpg",
                                filename: "photo2.jpg"
                            }
                        ]
                    },
                },
                include: {
                    user: true,
                    photos: true,
                },
            });
            expect(result).toEqual(mockCreatedReport);
        }));
        it("should create report with Turin coordinates", () => __awaiter(void 0, void 0, void 0, function* () {
            const turinReportData = Object.assign(Object.assign({}, validReportData), { latitude: 45.0703, longitude: 7.6869 });
            const mockCreatedReport = Object.assign(Object.assign({ id: 1 }, turinReportData), { status: "PENDING_APPROVAL", createdAt: new Date(), updatedAt: new Date(), user: { id: 1 }, photos: [] });
            mockCreate.mockResolvedValue(mockCreatedReport);
            const result = yield (0, reportService_1.createReport)(turinReportData);
            expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    latitude: 45.0703,
                    longitude: 7.6869
                })
            }));
            expect(result).toEqual(mockCreatedReport);
        }));
        it("should create report with different categories", () => __awaiter(void 0, void 0, void 0, function* () {
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
                const reportWithCategory = Object.assign(Object.assign({}, validReportData), { category: category });
                const mockCreatedReport = Object.assign(Object.assign({ id: 1 }, reportWithCategory), { status: "PENDING_APPROVAL", createdAt: new Date(), updatedAt: new Date(), user: { id: 1 }, photos: [] });
                mockCreate.mockResolvedValue(mockCreatedReport);
                yield (0, reportService_1.createReport)(reportWithCategory);
                expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
                    data: expect.objectContaining({
                        category: category
                    })
                }));
                jest.clearAllMocks();
            }
        }));
        it("should handle database errors", () => __awaiter(void 0, void 0, void 0, function* () {
            const error = new Error("Database connection failed");
            mockCreate.mockRejectedValue(error);
            yield expect((0, reportService_1.createReport)(validReportData)).rejects.toThrow(error);
            expect(mockCreate).toHaveBeenCalled();
        }));
        it("should create report with boundary coordinates", () => __awaiter(void 0, void 0, void 0, function* () {
            // Test coordinate ai limiti
            const boundaryTests = [
                { latitude: -90, longitude: -180 }, // Limite sud-ovest
                { latitude: 90, longitude: 180 }, // Limite nord-est  
                { latitude: 0, longitude: 0 }, // Equatore e meridiano di Greenwich
                { latitude: 45.1, longitude: 7.7 }, // Coordinate vicino a Torino
            ];
            for (const coords of boundaryTests) {
                const reportWithBoundaryCoords = Object.assign(Object.assign({}, validReportData), { latitude: coords.latitude, longitude: coords.longitude });
                const mockCreatedReport = Object.assign(Object.assign({ id: 1 }, reportWithBoundaryCoords), { status: "PENDING_APPROVAL", createdAt: new Date(), updatedAt: new Date(), user: { id: 1 }, photos: [] });
                mockCreate.mockResolvedValue(mockCreatedReport);
                yield (0, reportService_1.createReport)(reportWithBoundaryCoords);
                expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
                    data: expect.objectContaining({
                        latitude: coords.latitude,
                        longitude: coords.longitude
                    })
                }));
                jest.clearAllMocks();
            }
        }));
    });
    describe("getApprovedReports", () => {
        it("should return approved reports ordered by creation date", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockReports = [
                {
                    id: 1,
                    title: "Recent report",
                    description: "Recent issue",
                    category: "PUBLIC_LIGHTING",
                    latitude: 45.0703,
                    longitude: 7.6869,
                    status: "ASSIGNED",
                    createdAt: new Date("2023-12-01"),
                    user: {
                        first_name: "John",
                        last_name: "Doe",
                        email: "john.doe@example.com"
                    }
                },
                {
                    id: 2,
                    title: "Older report",
                    description: "Older issue",
                    category: "ROADS_AND_URBAN_FURNISHINGS",
                    latitude: 45.0704,
                    longitude: 7.6870,
                    status: "IN_PROGRESS",
                    createdAt: new Date("2023-11-01"),
                    user: {
                        first_name: "Jane",
                        last_name: "Smith",
                        email: "jane.smith@example.com"
                    }
                }
            ];
            mockFindMany.mockResolvedValue(mockReports);
            const result = yield (0, reportService_1.getApprovedReports)();
            expect(mockFindMany).toHaveBeenCalledWith({
                where: {
                    status: {
                        in: [
                            "ASSIGNED",
                            "IN_PROGRESS",
                            "RESOLVED"
                        ]
                    }
                },
                include: {
                    user: {
                        select: {
                            first_name: true,
                            last_name: true,
                            email: true,
                        }
                    }
                },
                orderBy: {
                    createdAt: "desc"
                }
            });
            expect(result).toEqual(mockReports);
        }));
        it("should return empty array when no approved reports exist", () => __awaiter(void 0, void 0, void 0, function* () {
            mockFindMany.mockResolvedValue([]);
            const result = yield (0, reportService_1.getApprovedReports)();
            expect(mockFindMany).toHaveBeenCalled();
            expect(result).toEqual([]);
        }));
        it("should filter out pending and rejected reports", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockApprovedReports = [
                {
                    id: 1,
                    status: "ASSIGNED",
                    user: { first_name: "John", last_name: "Doe", email: "john@example.com" }
                },
                {
                    id: 2,
                    status: "IN_PROGRESS",
                    user: { first_name: "Jane", last_name: "Smith", email: "jane@example.com" }
                },
                {
                    id: 3,
                    status: "RESOLVED",
                    user: { first_name: "Bob", last_name: "Johnson", email: "bob@example.com" }
                }
            ];
            mockFindMany.mockResolvedValue(mockApprovedReports);
            const result = yield (0, reportService_1.getApprovedReports)();
            // Verifica che la query filtri correttamente gli stati
            expect(mockFindMany).toHaveBeenCalledWith({
                where: {
                    status: {
                        in: ["ASSIGNED", "IN_PROGRESS", "RESOLVED"]
                    }
                },
                include: {
                    user: {
                        select: {
                            first_name: true,
                            last_name: true,
                            email: true,
                        }
                    }
                },
                orderBy: {
                    createdAt: "desc"
                }
            });
            expect(result).toEqual(mockApprovedReports);
        }));
        it("should handle database errors", () => __awaiter(void 0, void 0, void 0, function* () {
            const error = new Error("Database query failed");
            mockFindMany.mockRejectedValue(error);
            yield expect((0, reportService_1.getApprovedReports)()).rejects.toThrow(error);
            expect(mockFindMany).toHaveBeenCalled();
        }));
        it("should include user information in results", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockReports = [
                {
                    id: 1,
                    title: "Test report",
                    description: "Test description",
                    category: "PUBLIC_LIGHTING",
                    latitude: 45.0703,
                    longitude: 7.6869,
                    status: "ASSIGNED",
                    user: {
                        first_name: "John",
                        last_name: "Doe",
                        email: "john.doe@example.com"
                    }
                }
            ];
            mockFindMany.mockResolvedValue(mockReports);
            const result = yield (0, reportService_1.getApprovedReports)();
            expect(result[0].user).toEqual({
                first_name: "John",
                last_name: "Doe",
                email: "john.doe@example.com"
            });
        }));
        it("should order reports by creation date descending", () => __awaiter(void 0, void 0, void 0, function* () {
            mockFindMany.mockResolvedValue([]);
            yield (0, reportService_1.getApprovedReports)();
            expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
                orderBy: {
                    createdAt: "desc"
                }
            }));
        }));
    });
});
