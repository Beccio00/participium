import { toReportDTO, ReportDTO } from "../../../src/interfaces/ReportDTO";
import { Roles } from "../../../src/interfaces/UserDTO";

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
        address: "Via Roma 123, Torino",
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

      const result = toReportDTO(mockReport);

      expect(result).toEqual({
        id: 1,
        title: "Broken streetlight",
        description: "The streetlight is not working",
        category: "PUBLIC_LIGHTING",
        latitude: 45.0703,
        longitude: 7.6869,
        address: undefined,
        assignedTo: null,
        assignedToId: null,
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
        longitude: 7.687,
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

      const result = toReportDTO(mockReport);

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
        address: "Corso Vittorio 789, Torino",
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

      const result = toReportDTO(mockReport);

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
      const mockReport = {
        id: 4,
        title: "Another test",
        description: "Another test description",
        category: "WASTE",
        latitude: 45.0706,
        longitude: 7.6872,
        address: "Piazza San Carlo 10, Torino",
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

      const result = toReportDTO(mockReport);

      expect(result.user?.emailNotificationsEnabled).toBe(true);
    });

    it("should handle rejected report with rejection reason", () => {
      const mockReport = {
        id: 5,
        title: "Rejected report",
        description: "This report was rejected",
        category: "OTHER",
        latitude: 45.0707,
        longitude: 7.6873,
        address: "Via Po 15, Torino",
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

      const result = toReportDTO(mockReport);

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
        address: "Via Garibaldi 25, Torino",
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

      const result = toReportDTO(mockReport);

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

    it("should handle edge cases and null values", () => {
      const mockReport = {
        id: 7,
        title: "",
        description: "",
        category: "OTHER",
        latitude: 0,
        longitude: 0,
        address: "",
        isAnonymous: true,
        status: "PENDING_APPROVAL",
        userId: 7,
        user: null,
        messages: [],
        rejectionReason: null,
        photos: [],
        createdAt: "2023-01-07T00:00:00Z",
        updatedAt: "2023-01-07T00:00:00Z",
      };

      const result = toReportDTO(mockReport);

      expect(result.title).toBe("");
      expect(result.description).toBe("");
      expect(result.latitude).toBe(0);
      expect(result.longitude).toBe(0);
      expect(result.address).toBe("");
      expect(result.user).toBeUndefined();
      expect(result.rejectedReason).toBeNull();
    });

    it("should handle missing rejectionReason field", () => {
      const mockReport = {
        id: 8,
        title: "Test without rejection reason field",
        description: "Testing missing field",
        category: "OTHER",
        latitude: 45.0709,
        longitude: 7.6875,
        address: "Via Test 1, Torino",
        isAnonymous: false,
        status: "PENDING_APPROVAL",
        userId: 8,
        user: null,
        messages: [],
        // rejectionReason field is missing completely
        photos: [],
        createdAt: "2023-01-08T00:00:00Z",
        updatedAt: "2023-01-08T00:00:00Z",
      };

      const result = toReportDTO(mockReport);

      expect(result.rejectedReason).toBeNull();
    });

    it("should handle various photo formats", () => {
      const mockReport = {
        id: 9,
        title: "Report with various photos",
        description: "Testing different photo formats",
        category: "PUBLIC_LIGHTING",
        latitude: 45.0710,
        longitude: 7.6876,
        address: "Via Foto 2, Torino",
        isAnonymous: false,
        status: "PENDING_APPROVAL",
        userId: 9,
        user: null,
        messages: [],
        rejectionReason: null,
        photos: [
          {
            id: 1,
            url: "https://example.com/photo1.jpg",
            filename: "photo1.jpg",
          },
          {
            id: 2,
            url: "https://example.com/photo2.png",
            filename: "photo2.png",
          },
          {
            id: 3,
            url: "https://example.com/photo3.jpeg",
            filename: "photo3.jpeg",
          },
        ],
        createdAt: "2023-01-09T00:00:00Z",
        updatedAt: "2023-01-09T00:00:00Z",
      };

      const result = toReportDTO(mockReport);

      expect(result.photos).toHaveLength(3);
      expect(result.photos[0]).toEqual({
        id: 1,
        url: "https://example.com/photo1.jpg",
        filename: "photo1.jpg",
      });
      expect(result.photos[2]).toEqual({
        id: 3,
        url: "https://example.com/photo3.jpeg",
        filename: "photo3.jpeg",
      });
    });

    it("should handle municipality user roles", () => {
      const mockReport = {
        id: 10,
        title: "Report from municipality user",
        description: "Report created by technical office",
        category: "ROADS_AND_URBAN_FURNISHINGS",
        latitude: 45.0711,
        longitude: 7.6877,
        address: "Via Municipio 3, Torino",
        isAnonymous: false,
        status: "IN_PROGRESS",
        userId: 10,
        user: {
          id: 10,
          first_name: "Mario",
          last_name: "Rossi",
          email: "mario.rossi@comune.torino.it",
          role: "TECHNICAL_OFFICE",
          telegram_username: null,
          email_notifications_enabled: true,
        },
        messages: [],
        rejectionReason: null,
        photos: [],
        createdAt: "2023-01-10T00:00:00Z",
        updatedAt: "2023-01-10T00:00:00Z",
      };

      const result = toReportDTO(mockReport);

      expect(result.user?.role).toBe("TECHNICAL_OFFICE");
      expect(result.user?.email).toBe("mario.rossi@comune.torino.it");
      expect(result.user?.telegramUsername).toBeNull();
    });
  });
});
