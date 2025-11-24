"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ReportDTO_1 = require("../../../src/interfaces/ReportDTO");
describe("ReportDTO", () => {
    describe("toReportDTO", () => {
        it("should convert report with user to ReportDTO", () => {
            const mockReport = {
                id: 1,
                title: "Broken streetlight",
                description: "The streetlight is not working",
                category: "PUBLIC_LIGHTING",
                latitude: 45.0703,
                longitude: 7.6869,
                isAnonymous: false,
                status: "PENDING_APPROVAL",
                userId: 1,
                user: {
                    id: 1,
                    first_name: "John",
                    last_name: "Doe",
                    email: "john.doe@example.com",
                    role: "CITIZEN",
                    telegram_username: "johndoe",
                    email_notifications_enabled: true,
                },
                messages: [
                    {
                        id: 1,
                        content: "Report submitted",
                        createdAt: "2023-01-01T00:00:00Z",
                        senderId: 1,
                    },
                ],
                rejectionReason: null,
                photos: [
                    {
                        id: 1,
                        url: "https://example.com/photo.jpg",
                        filename: "streetlight.jpg",
                    },
                ],
                createdAt: "2023-01-01T00:00:00Z",
                updatedAt: "2023-01-01T00:00:00Z",
            };
            const result = (0, ReportDTO_1.toReportDTO)(mockReport);
            expect(result).toEqual({
                id: 1,
                title: "Broken streetlight",
                description: "The streetlight is not working",
                category: "PUBLIC_LIGHTING",
                latitude: 45.0703,
                longitude: 7.6869,
                isAnonymous: false,
                status: "PENDING_APPROVAL",
                userId: 1,
                user: {
                    id: 1,
                    firstName: "John",
                    lastName: "Doe",
                    email: "john.doe@example.com",
                    role: "CITIZEN",
                    telegramUsername: "johndoe",
                    emailNotificationsEnabled: true,
                },
                messages: [
                    {
                        id: 1,
                        content: "Report submitted",
                        createdAt: "2023-01-01T00:00:00Z",
                        senderId: 1,
                    },
                ],
                rejectedReason: null,
                photos: [
                    {
                        id: 1,
                        url: "https://example.com/photo.jpg",
                        filename: "streetlight.jpg",
                    },
                ],
                createdAt: "2023-01-01T00:00:00Z",
                updatedAt: "2023-01-01T00:00:00Z",
            });
        });
        it("should convert report without user to ReportDTO", () => {
            const mockReport = {
                id: 2,
                title: "Pothole",
                description: "Large pothole on main street",
                category: "ROADS_AND_URBAN_FURNISHINGS",
                latitude: 45.0704,
                longitude: 7.6870,
                isAnonymous: true,
                status: "ASSIGNED",
                userId: 2,
                user: undefined,
                messages: [],
                rejectionReason: null,
                photos: [],
                createdAt: "2023-01-02T00:00:00Z",
                updatedAt: "2023-01-02T00:00:00Z",
            };
            const result = (0, ReportDTO_1.toReportDTO)(mockReport);
            expect(result.user).toBeUndefined();
            expect(result.messages).toEqual([]);
            expect(result.photos).toEqual([]);
            expect(result.isAnonymous).toBe(true);
        });
        it("should handle user with null telegram_username", () => {
            const mockReport = {
                id: 3,
                title: "Test report",
                description: "Test description",
                category: "OTHER",
                latitude: 45.0705,
                longitude: 7.6871,
                isAnonymous: false,
                status: "IN_PROGRESS",
                userId: 3,
                user: {
                    id: 3,
                    first_name: "Jane",
                    last_name: "Smith",
                    email: "jane.smith@example.com",
                    role: "CITIZEN",
                    telegram_username: null,
                    email_notifications_enabled: false,
                },
                messages: [],
                rejectionReason: null,
                photos: [],
                createdAt: "2023-01-03T00:00:00Z",
                updatedAt: "2023-01-03T00:00:00Z",
            };
            const result = (0, ReportDTO_1.toReportDTO)(mockReport);
            expect(result.user).toEqual({
                id: 3,
                firstName: "Jane",
                lastName: "Smith",
                email: "jane.smith@example.com",
                role: "CITIZEN",
                telegramUsername: null,
                emailNotificationsEnabled: false,
            });
        });
        it("should handle user with null email_notifications_enabled (default to true)", () => {
            var _a;
            const mockReport = {
                id: 4,
                title: "Another test",
                description: "Another test description",
                category: "WASTE",
                latitude: 45.0706,
                longitude: 7.6872,
                isAnonymous: false,
                status: "RESOLVED",
                userId: 4,
                user: {
                    id: 4,
                    first_name: "Bob",
                    last_name: "Johnson",
                    email: "bob.johnson@example.com",
                    role: "CITIZEN",
                    telegram_username: "bobjohnson",
                    email_notifications_enabled: null,
                },
                messages: [],
                rejectionReason: null,
                photos: [],
                createdAt: "2023-01-04T00:00:00Z",
                updatedAt: "2023-01-04T00:00:00Z",
            };
            const result = (0, ReportDTO_1.toReportDTO)(mockReport);
            expect((_a = result.user) === null || _a === void 0 ? void 0 : _a.emailNotificationsEnabled).toBe(true);
        });
        it("should handle rejected report with rejection reason", () => {
            const mockReport = {
                id: 5,
                title: "Rejected report",
                description: "This report was rejected",
                category: "OTHER",
                latitude: 45.0707,
                longitude: 7.6873,
                isAnonymous: false,
                status: "REJECTED",
                userId: 5,
                user: {
                    id: 5,
                    first_name: "Alice",
                    last_name: "Brown",
                    email: "alice.brown@example.com",
                    role: "CITIZEN",
                    telegram_username: "alicebrown",
                    email_notifications_enabled: true,
                },
                messages: [],
                rejectionReason: "Insufficient information provided",
                photos: [],
                createdAt: "2023-01-05T00:00:00Z",
                updatedAt: "2023-01-05T00:00:00Z",
            };
            const result = (0, ReportDTO_1.toReportDTO)(mockReport);
            expect(result.rejectedReason).toBe("Insufficient information provided");
        });
        it("should handle multiple messages", () => {
            const mockReport = {
                id: 6,
                title: "Report with messages",
                description: "Report that has multiple messages",
                category: "PUBLIC_LIGHTING",
                latitude: 45.0708,
                longitude: 7.6874,
                isAnonymous: false,
                status: "IN_PROGRESS",
                userId: 6,
                user: {
                    id: 6,
                    first_name: "Charlie",
                    last_name: "Davis",
                    email: "charlie.davis@example.com",
                    role: "CITIZEN",
                    telegram_username: "charliedavis",
                    email_notifications_enabled: true,
                },
                messages: [
                    {
                        id: 1,
                        content: "Report submitted",
                        createdAt: "2023-01-06T10:00:00Z",
                        senderId: 6,
                    },
                    {
                        id: 2,
                        content: "Report approved",
                        createdAt: "2023-01-06T11:00:00Z",
                        senderId: 1,
                    },
                    {
                        id: 3,
                        content: "Work started",
                        createdAt: "2023-01-06T12:00:00Z",
                        senderId: 2,
                    },
                ],
                rejectionReason: null,
                photos: [],
                createdAt: "2023-01-06T00:00:00Z",
                updatedAt: "2023-01-06T12:00:00Z",
            };
            const result = (0, ReportDTO_1.toReportDTO)(mockReport);
            expect(result.messages).toHaveLength(3);
            expect(result.messages[0]).toEqual({
                id: 1,
                content: "Report submitted",
                createdAt: "2023-01-06T10:00:00Z",
                senderId: 6,
            });
            expect(result.messages[2]).toEqual({
                id: 3,
                content: "Work started",
                createdAt: "2023-01-06T12:00:00Z",
                senderId: 2,
            });
        });
    });
});
