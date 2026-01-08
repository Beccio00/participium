import { ReportStatus } from "../../../../shared/ReportTypes";
import { Role } from "../../../../shared/RoleTypes";
import { NotFoundError, ForbiddenError } from "../../../src/utils/errors";

// Create mock functions at module level
const mockReportFindByIdWithRelations = jest.fn();
const mockMessageCreate = jest.fn();
const mockMessageFindByReportId = jest.fn();
const mockNotifyNewMessage = jest.fn();

// Mock repositories BEFORE importing the service
jest.mock("../../../src/repositories/ReportRepository", () => ({
  ReportRepository: jest.fn().mockImplementation(() => ({
    findByIdWithRelations: mockReportFindByIdWithRelations,
  })),
}));

jest.mock("../../../src/repositories/ReportMessageRepository", () => ({
  ReportMessageRepository: jest.fn().mockImplementation(() => ({
    create: mockMessageCreate,
    findByReportId: mockMessageFindByReportId,
  })),
}));

jest.mock("../../../src/services/notificationService", () => ({
  notifyNewMessage: mockNotifyNewMessage,
}));

// Import AFTER mocks are set up
import {
  sendMessageToCitizen,
  getReportMessages,
} from "../../../src/services/messageService";

describe("messageService", () => {
  const mockDate = new Date("2025-12-30T10:00:00.000Z");

  // Helper to generate a mock report entity
  const createMockReport = (overrides: any = {}) => ({
    id: 1,
    title: "Test Report",
    status: ReportStatus.ASSIGNED,
    userId: 100, // Citizen user ID
    assignedOfficerId: 50, // Internal technical staff ID
    externalMaintainerId: null,
    user: {
      id: 100,
      first_name: "John",
      last_name: "Doe",
      role: Role.CITIZEN,
    },
    assignedOfficer: {
      id: 50,
      first_name: "Jane",
      last_name: "Smith",
      role: Role.LOCAL_PUBLIC_SERVICES,
    },
    externalMaintainer: null,
    ...overrides,
  });

  // Helper to generate a mock message entity
  const createMockMessage = (overrides: any = {}) => ({
    id: 1,
    content: "Test message",
    reportId: 1,
    senderId: 50,
    createdAt: mockDate,
    user: {
      id: 50,
      role: Role.LOCAL_PUBLIC_SERVICES,
    },
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================
  // SEND MESSAGE TESTS
  // =========================
  describe("sendMessageToCitizen", () => {
    describe("Authorization and Access", () => {
      it("should throw NotFoundError if report does not exist", async () => {
        mockReportFindByIdWithRelations.mockResolvedValue(null);

        await expect(sendMessageToCitizen(999, 50, "Hello")).rejects.toThrow(
          NotFoundError
        );
      });

      it("should throw ForbiddenError if user is not assigned to report", async () => {
        const report = createMockReport({
          assignedOfficerId: 50,
          externalMaintainerId: null,
        });
        mockReportFindByIdWithRelations.mockResolvedValue(report);

        // User 999 is not assigned to this report
        await expect(sendMessageToCitizen(1, 999, "Hello")).rejects.toThrow(
          ForbiddenError
        );
      });

      it("should allow assigned internal technical staff to send message", async () => {
        const report = createMockReport({
          assignedOfficerId: 50,
          externalMaintainerId: null,
        });
        const savedMessage = createMockMessage();

        mockReportFindByIdWithRelations.mockResolvedValue(report);
        mockMessageCreate.mockResolvedValue(savedMessage);

        const result = await sendMessageToCitizen(1, 50, "Status update");

        expect(mockMessageCreate).toHaveBeenCalledWith({
          content: "Status update",
          reportId: 1,
          senderId: 50,
        });
        expect(result.content).toBe("Test message");
      });

      it("should allow assigned external maintainer to send message", async () => {
        const report = createMockReport({
          assignedOfficerId: null,
          externalMaintainerId: 60,
          externalMaintainer: {
            id: 60,
            first_name: "Bob",
            last_name: "Builder",
            role: Role.EXTERNAL_MAINTAINER,
          },
        });
        const savedMessage = createMockMessage({
          senderId: 60,
          user: { id: 60, role: Role.EXTERNAL_MAINTAINER },
        });

        mockReportFindByIdWithRelations.mockResolvedValue(report);
        mockMessageCreate.mockResolvedValue(savedMessage);

        const result = await sendMessageToCitizen(1, 60, "Repair scheduled");

        expect(mockMessageCreate).toHaveBeenCalledWith({
          content: "Repair scheduled",
          reportId: 1,
          senderId: 60,
        });
        expect(result.senderId).toBe(60);
      });

      it("should allow citizen owner to send message (reply)", async () => {
        const report = createMockReport({
          userId: 100,
          assignedOfficerId: 50,
        });
        const savedMessage = createMockMessage({
          senderId: 100,
          content: "Thank you for the update",
          user: { id: 100, role: Role.CITIZEN },
        });

        mockReportFindByIdWithRelations.mockResolvedValue(report);
        mockMessageCreate.mockResolvedValue(savedMessage);

        const result = await sendMessageToCitizen(
          1,
          100,
          "Thank you for the update"
        );

        expect(mockMessageCreate).toHaveBeenCalledWith({
          content: "Thank you for the update",
          reportId: 1,
          senderId: 100,
        });
        expect(result.senderRoles).toContain(Role.CITIZEN);
      });
    });

    describe("Message Creation", () => {
      it("should create message with correct structure", async () => {
        const report = createMockReport();
        const savedMessage = createMockMessage({
          id: 42,
          content: "Test content",
          senderId: 50,
          createdAt: mockDate,
        });

        mockReportFindByIdWithRelations.mockResolvedValue(report);
        mockMessageCreate.mockResolvedValue(savedMessage);

        const result = await sendMessageToCitizen(1, 50, "Test content");

        expect(result).toEqual({
          id: 42,
          content: "Test content",
          createdAt: mockDate.toISOString(),
          senderId: 50,
          senderRoles: [Role.LOCAL_PUBLIC_SERVICES],
        });
      });

      it("should handle multiline message content", async () => {
        const report = createMockReport();
        const multilineContent = "Line 1\nLine 2\nLine 3";
        const savedMessage = createMockMessage({
          content: multilineContent,
        });

        mockReportFindByIdWithRelations.mockResolvedValue(report);
        mockMessageCreate.mockResolvedValue(savedMessage);

        await sendMessageToCitizen(1, 50, multilineContent);

        expect(mockMessageCreate).toHaveBeenCalledWith({
          content: multilineContent,
          reportId: 1,
          senderId: 50,
        });
      });

      it("should handle long message content", async () => {
        const report = createMockReport();
        const longContent = "A".repeat(1000);
        const savedMessage = createMockMessage({
          content: longContent,
        });

        mockReportFindByIdWithRelations.mockResolvedValue(report);
        mockMessageCreate.mockResolvedValue(savedMessage);

        await sendMessageToCitizen(1, 50, longContent);

        expect(mockMessageCreate).toHaveBeenCalledWith({
          content: longContent,
          reportId: 1,
          senderId: 50,
        });
      });
    });

    describe("Notifications", () => {
      it("should notify technical staff when citizen sends message", async () => {
        const report = createMockReport({
          userId: 100,
          assignedOfficerId: 50,
        });
        const savedMessage = createMockMessage({
          senderId: 100,
          user: { id: 100, role: Role.CITIZEN },
        });

        mockReportFindByIdWithRelations.mockResolvedValue(report);
        mockMessageCreate.mockResolvedValue(savedMessage);

        await sendMessageToCitizen(1, 100, "Citizen message");

        expect(mockNotifyNewMessage).toHaveBeenCalledWith(
          1,
          50, // Technical staff should be notified
          "John Doe"
        );
      });

      it("should notify external maintainer when citizen sends message", async () => {
        const report = createMockReport({
          userId: 100,
          assignedOfficerId: null,
          externalMaintainerId: 60,
        });
        const savedMessage = createMockMessage({
          senderId: 100,
          user: { id: 100, role: Role.CITIZEN },
        });

        mockReportFindByIdWithRelations.mockResolvedValue(report);
        mockMessageCreate.mockResolvedValue(savedMessage);

        await sendMessageToCitizen(1, 100, "Citizen reply");

        expect(mockNotifyNewMessage).toHaveBeenCalledWith(
          1,
          60, // External maintainer should be notified
          "John Doe"
        );
      });

      it("should notify citizen when technical staff sends message", async () => {
        const report = createMockReport({
          userId: 100,
          assignedOfficerId: 50,
        });
        const savedMessage = createMockMessage();

        mockReportFindByIdWithRelations.mockResolvedValue(report);
        mockMessageCreate.mockResolvedValue(savedMessage);

        await sendMessageToCitizen(1, 50, "Technical update");

        expect(mockNotifyNewMessage).toHaveBeenCalledWith(
          1,
          100, // Citizen should be notified
          "Jane Smith (Technical)"
        );
      });

      it("should notify citizen when external maintainer sends message", async () => {
        const report = createMockReport({
          userId: 100,
          assignedOfficerId: null,
          externalMaintainerId: 60,
          externalMaintainer: {
            id: 60,
            first_name: "Bob",
            last_name: "Builder",
            role: Role.EXTERNAL_MAINTAINER,
          },
        });
        const savedMessage = createMockMessage({
          senderId: 60,
          user: { id: 60, role: Role.EXTERNAL_MAINTAINER },
        });

        mockReportFindByIdWithRelations.mockResolvedValue(report);
        mockMessageCreate.mockResolvedValue(savedMessage);

        await sendMessageToCitizen(1, 60, "External update");

        expect(mockNotifyNewMessage).toHaveBeenCalledWith(
          1,
          100, // Citizen should be notified
          "Bob Builder (External Maintainer)"
        );
      });

      it("should handle citizen name defaults if missing", async () => {
        const report = createMockReport({
          userId: 100,
          assignedOfficerId: 50,
          user: {
            id: 100,
            first_name: null,
            last_name: null,
            role: Role.CITIZEN,
          },
        });
        const savedMessage = createMockMessage({
          senderId: 100,
          user: { id: 100, role: Role.CITIZEN },
        });

        mockReportFindByIdWithRelations.mockResolvedValue(report);
        mockMessageCreate.mockResolvedValue(savedMessage);

        await sendMessageToCitizen(1, 100, "Anonymous message");

        expect(mockNotifyNewMessage).toHaveBeenCalledWith(1, 50, "Citizen");
      });
    });
  });

  // =========================
  // GET MESSAGES TESTS
  // =========================
  describe("getReportMessages", () => {
    describe("Authorization", () => {
      it("should throw NotFoundError if report does not exist", async () => {
        mockReportFindByIdWithRelations.mockResolvedValue(null);

        await expect(getReportMessages(999, 50)).rejects.toThrow(NotFoundError);
      });

      it("should throw ForbiddenError if user is not authorized", async () => {
        const report = createMockReport({
          userId: 100,
          assignedOfficerId: 50,
          externalMaintainerId: null,
        });
        mockReportFindByIdWithRelations.mockResolvedValue(report);

        // User 999 is not the owner or assigned
        await expect(getReportMessages(1, 999)).rejects.toThrow(ForbiddenError);
      });

      it("should allow report owner (citizen) to view messages", async () => {
        const report = createMockReport({ userId: 100 });
        mockReportFindByIdWithRelations.mockResolvedValue(report);
        mockMessageFindByReportId.mockResolvedValue([]);

        await getReportMessages(1, 100);

        expect(mockMessageFindByReportId).toHaveBeenCalledWith(1);
      });

      it("should allow assigned technical staff to view messages", async () => {
        const report = createMockReport({ assignedOfficerId: 50 });
        mockReportFindByIdWithRelations.mockResolvedValue(report);
        mockMessageFindByReportId.mockResolvedValue([]);

        await getReportMessages(1, 50);

        expect(mockMessageFindByReportId).toHaveBeenCalledWith(1);
      });

      it("should allow assigned external maintainer to view messages", async () => {
        const report = createMockReport({
          assignedOfficerId: null,
          externalMaintainerId: 60,
        });
        mockReportFindByIdWithRelations.mockResolvedValue(report);
        mockMessageFindByReportId.mockResolvedValue([]);

        await getReportMessages(1, 60);

        expect(mockMessageFindByReportId).toHaveBeenCalledWith(1);
      });
    });

    describe("Message Retrieval", () => {
      it("should return empty array when no messages exist", async () => {
        const report = createMockReport();
        mockReportFindByIdWithRelations.mockResolvedValue(report);
        mockMessageFindByReportId.mockResolvedValue([]);

        const result = await getReportMessages(1, 50);

        expect(result).toEqual([]);
      });

      it("should return formatted message list", async () => {
        const report = createMockReport();
        const messages = [
          createMockMessage({
            id: 1,
            content: "First message",
            senderId: 50,
            createdAt: new Date("2025-12-30T10:00:00.000Z"),
            user: { role: Role.LOCAL_PUBLIC_SERVICES },
          }),
          createMockMessage({
            id: 2,
            content: "Second message",
            senderId: 100,
            createdAt: new Date("2025-12-30T11:00:00.000Z"),
            user: { role: Role.CITIZEN },
          }),
        ];

        mockReportFindByIdWithRelations.mockResolvedValue(report);
        mockMessageFindByReportId.mockResolvedValue(messages);

        const result = await getReportMessages(1, 50);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          id: 1,
          content: "First message",
          createdAt: "2025-12-30T10:00:00.000Z",
          senderId: 50,
          senderRoles: [Role.LOCAL_PUBLIC_SERVICES],
        });
        expect(result[1]).toEqual({
          id: 2,
          content: "Second message",
          createdAt: "2025-12-30T11:00:00.000Z",
          senderId: 100,
          senderRoles: [Role.CITIZEN],
        });
      });

      it("should return conversation with multiple participants", async () => {
        const report = createMockReport();
        const messages = [
          createMockMessage({
            id: 1,
            content: "Tech: Issue identified",
            senderId: 50,
            user: { role: Role.LOCAL_PUBLIC_SERVICES },
          }),
          createMockMessage({
            id: 2,
            content: "Citizen: Thank you",
            senderId: 100,
            user: { role: Role.CITIZEN },
          }),
          createMockMessage({
            id: 3,
            content: "Tech: Will fix tomorrow",
            senderId: 50,
            user: { role: Role.LOCAL_PUBLIC_SERVICES },
          }),
          createMockMessage({
            id: 4,
            content: "Citizen: Great!",
            senderId: 100,
            user: { role: Role.CITIZEN },
          }),
        ];

        mockReportFindByIdWithRelations.mockResolvedValue(report);
        mockMessageFindByReportId.mockResolvedValue(messages);

        const result = await getReportMessages(1, 100);

        expect(result).toHaveLength(4);
        expect(result.map((m) => m.senderRoles[0])).toEqual([
          Role.LOCAL_PUBLIC_SERVICES,
          Role.CITIZEN,
          Role.LOCAL_PUBLIC_SERVICES,
          Role.CITIZEN,
        ]);
      });

      it("should handle messages with external maintainer", async () => {
        const report = createMockReport({
          externalMaintainerId: 60,
        });
        const messages = [
          createMockMessage({
            id: 1,
            content: "External: Parts ordered",
            senderId: 60,
            user: { role: Role.EXTERNAL_MAINTAINER },
          }),
        ];

        mockReportFindByIdWithRelations.mockResolvedValue(report);
        mockMessageFindByReportId.mockResolvedValue(messages);

        const result = await getReportMessages(1, 60);

        expect(result[0].senderRoles).toContain(Role.EXTERNAL_MAINTAINER);
      });
    });
  });
});
