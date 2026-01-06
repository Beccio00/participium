import {
  TelegramTokenResponseDTO,
  TelegramLinkRequestDTO,
  TelegramLinkResponseDTO,
  TelegramStatusResponseDTO,
  TelegramUnlinkResponseDTO,
  TelegramCreateReportRequestDTO,
  TelegramCreateReportResponseDTO,
} from "../../../src/interfaces/TelegramDTO";

describe("TelegramDTO Interface Tests", () => {
  describe("TelegramTokenResponseDTO", () => {
    it("should accept valid token response object", () => {
      const validResponse: TelegramTokenResponseDTO = {
        token: "ABC123",
        expiresAt: "2024-01-01T12:00:00.000Z",
        deepLink: "https://t.me/participium_bot?start=link_ABC123",
        message: "Click the link to connect your Telegram account",
      };

      expect(validResponse.token).toBe("ABC123");
      expect(validResponse.expiresAt).toBe("2024-01-01T12:00:00.000Z");
      expect(validResponse.deepLink).toContain("https://t.me/");
      expect(validResponse.message).toBeTruthy();
    });

    it("should have all required properties", () => {
      const response: TelegramTokenResponseDTO = {
        token: "test",
        expiresAt: "2024-01-01T00:00:00.000Z",
        deepLink: "https://t.me/bot?start=test",
        message: "test message",
      };

      expect(response).toHaveProperty("token");
      expect(response).toHaveProperty("expiresAt");
      expect(response).toHaveProperty("deepLink");
      expect(response).toHaveProperty("message");
    });

    it("should accept different token formats", () => {
      const responses: TelegramTokenResponseDTO[] = [
        {
          token: "SHORT",
          expiresAt: "2024-01-01T00:00:00.000Z",
          deepLink: "https://t.me/bot?start=SHORT",
          message: "Short token",
        },
        {
          token: "VeryLongTokenWithManyCharacters123456789",
          expiresAt: "2024-12-31T23:59:59.999Z",
          deepLink: "https://t.me/bot?start=VeryLongTokenWithManyCharacters123456789",
          message: "Long token message",
        },
      ];

      responses.forEach(response => {
        expect(typeof response.token).toBe("string");
        expect(typeof response.expiresAt).toBe("string");
        expect(typeof response.deepLink).toBe("string");
        expect(typeof response.message).toBe("string");
      });
    });
  });

  describe("TelegramLinkRequestDTO", () => {
    it("should accept valid link request with username", () => {
      const validRequest: TelegramLinkRequestDTO = {
        token: "ABC123",
        telegramId: "123456789",
        telegramUsername: "johnDoe",
      };

      expect(validRequest.token).toBe("ABC123");
      expect(validRequest.telegramId).toBe("123456789");
      expect(validRequest.telegramUsername).toBe("johnDoe");
    });

    it("should accept valid link request without username", () => {
      const validRequest: TelegramLinkRequestDTO = {
        token: "ABC123",
        telegramId: "123456789",
      };

      expect(validRequest.token).toBe("ABC123");
      expect(validRequest.telegramId).toBe("123456789");
      expect(validRequest.telegramUsername).toBeUndefined();
    });

    it("should accept null username", () => {
      const validRequest: TelegramLinkRequestDTO = {
        token: "ABC123",
        telegramId: "123456789",
        telegramUsername: null,
      };

      expect(validRequest.telegramUsername).toBeNull();
    });

    it("should have required properties", () => {
      const request: TelegramLinkRequestDTO = {
        token: "test",
        telegramId: "test",
      };

      expect(request).toHaveProperty("token");
      expect(request).toHaveProperty("telegramId");
    });
  });

  describe("TelegramLinkResponseDTO", () => {
    it("should accept valid link response", () => {
      const validResponse: TelegramLinkResponseDTO = {
        success: true,
        message: "Telegram account linked successfully",
        user: {
          id: 1,
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      };

      expect(validResponse.success).toBe(true);
      expect(validResponse.message).toBeTruthy();
      expect(validResponse.user).toBeDefined();
      expect(validResponse.user.id).toBe(1);
      expect(validResponse.user.firstName).toBe("John");
    });

    it("should accept failed response", () => {
      const failResponse: TelegramLinkResponseDTO = {
        success: false,
        message: "Failed to link account",
        user: {
          id: 0,
          firstName: "",
          lastName: "",
          email: "",
        },
      };

      expect(failResponse.success).toBe(false);
      expect(failResponse.message).toBeTruthy();
    });

    it("should have nested user object with correct structure", () => {
      const response: TelegramLinkResponseDTO = {
        success: true,
        message: "test",
        user: {
          id: 999,
          firstName: "Test",
          lastName: "User",
          email: "test@test.com",
        },
      };

      expect(response.user).toHaveProperty("id");
      expect(response.user).toHaveProperty("firstName");
      expect(response.user).toHaveProperty("lastName");
      expect(response.user).toHaveProperty("email");
      expect(typeof response.user.id).toBe("number");
      expect(typeof response.user.firstName).toBe("string");
    });
  });

  describe("TelegramStatusResponseDTO", () => {
    it("should accept linked status", () => {
      const linkedStatus: TelegramStatusResponseDTO = {
        linked: true,
        telegramUsername: "johnDoe",
        telegramId: "123456789",
      };

      expect(linkedStatus.linked).toBe(true);
      expect(linkedStatus.telegramUsername).toBe("johnDoe");
      expect(linkedStatus.telegramId).toBe("123456789");
    });

    it("should accept unlinked status", () => {
      const unlinkedStatus: TelegramStatusResponseDTO = {
        linked: false,
        telegramUsername: null,
        telegramId: null,
      };

      expect(unlinkedStatus.linked).toBe(false);
      expect(unlinkedStatus.telegramUsername).toBeNull();
      expect(unlinkedStatus.telegramId).toBeNull();
    });

    it("should handle partial linking information", () => {
      const partialStatus: TelegramStatusResponseDTO = {
        linked: true,
        telegramUsername: null, // User without username
        telegramId: "123456789",
      };

      expect(partialStatus.linked).toBe(true);
      expect(partialStatus.telegramUsername).toBeNull();
      expect(partialStatus.telegramId).toBeTruthy();
    });
  });

  describe("TelegramUnlinkResponseDTO", () => {
    it("should accept successful unlink response", () => {
      const successResponse: TelegramUnlinkResponseDTO = {
        success: true,
        message: "Telegram account unlinked successfully",
      };

      expect(successResponse.success).toBe(true);
      expect(successResponse.message).toBeTruthy();
    });

    it("should accept failed unlink response", () => {
      const failResponse: TelegramUnlinkResponseDTO = {
        success: false,
        message: "Failed to unlink account",
      };

      expect(failResponse.success).toBe(false);
      expect(failResponse.message).toBeTruthy();
    });
  });

  describe("TelegramCreateReportRequestDTO", () => {
    it("should accept valid report request with all fields", () => {
      const validRequest: TelegramCreateReportRequestDTO = {
        telegramId: "123456789",
        title: "Broken streetlight",
        description: "The streetlight on Main Street is not working properly",
        category: "PUBLIC_LIGHTING",
        latitude: 45.0703,
        longitude: 7.6869,
        isAnonymous: false,
        photoFileIds: ["file1", "file2"],
      };

      expect(validRequest.telegramId).toBe("123456789");
      expect(validRequest.title).toBeTruthy();
      expect(validRequest.description).toBeTruthy();
      expect(validRequest.category).toBe("PUBLIC_LIGHTING");
      expect(typeof validRequest.latitude).toBe("number");
      expect(typeof validRequest.longitude).toBe("number");
      expect(validRequest.isAnonymous).toBe(false);
      expect(Array.isArray(validRequest.photoFileIds)).toBe(true);
    });

    it("should accept minimal report request", () => {
      const minimalRequest: TelegramCreateReportRequestDTO = {
        telegramId: "123456789",
        title: "Test Report",
        description: "Test description",
        category: "ROADS_URBAN_FURNISHINGS",
        latitude: 45.0703,
        longitude: 7.6869,
      };

      expect(minimalRequest.telegramId).toBeTruthy();
      expect(minimalRequest.isAnonymous).toBeUndefined();
      expect(minimalRequest.photoFileIds).toBeUndefined();
    });

    it("should accept anonymous report", () => {
      const anonymousRequest: TelegramCreateReportRequestDTO = {
        telegramId: "123456789",
        title: "Anonymous Report",
        description: "This is an anonymous report",
        category: "ENVIRONMENT",
        latitude: 45.0703,
        longitude: 7.6869,
        isAnonymous: true,
      };

      expect(anonymousRequest.isAnonymous).toBe(true);
    });

    it("should accept different coordinate ranges", () => {
      const requests: TelegramCreateReportRequestDTO[] = [
        {
          telegramId: "123",
          title: "North",
          description: "Northern location",
          category: "OTHER",
          latitude: 89.9,
          longitude: 180.0,
        },
        {
          telegramId: "123",
          title: "South",
          description: "Southern location",
          category: "OTHER",
          latitude: -89.9,
          longitude: -180.0,
        },
        {
          telegramId: "123",
          title: "Zero",
          description: "Zero coordinates",
          category: "OTHER",
          latitude: 0.0,
          longitude: 0.0,
        },
      ];

      requests.forEach(request => {
        expect(typeof request.latitude).toBe("number");
        expect(typeof request.longitude).toBe("number");
        expect(request.latitude).toBeGreaterThanOrEqual(-90);
        expect(request.latitude).toBeLessThanOrEqual(90);
        expect(request.longitude).toBeGreaterThanOrEqual(-180);
        expect(request.longitude).toBeLessThanOrEqual(180);
      });
    });
  });

  describe("TelegramCreateReportResponseDTO", () => {
    it("should accept successful report creation response", () => {
      const successResponse: TelegramCreateReportResponseDTO = {
        success: true,
        message: "Report created successfully",
        reportId: 123,
      };

      expect(successResponse.success).toBe(true);
      expect(successResponse.message).toBeTruthy();
      expect(typeof successResponse.reportId).toBe("number");
      expect(successResponse.reportId).toBeGreaterThan(0);
    });

    it("should accept failed report creation response", () => {
      const failResponse: TelegramCreateReportResponseDTO = {
        success: false,
        message: "Failed to create report",
        reportId: 0,
      };

      expect(failResponse.success).toBe(false);
      expect(failResponse.reportId).toBe(0);
    });
  });

  describe("Interface compatibility tests", () => {
    it("should maintain consistent success/message pattern", () => {
      const linkResponse: TelegramLinkResponseDTO = {
        success: true,
        message: "test",
        user: { id: 1, firstName: "test", lastName: "test", email: "test" },
      };

      const unlinkResponse: TelegramUnlinkResponseDTO = {
        success: true,
        message: "test",
      };

      const createReportResponse: TelegramCreateReportResponseDTO = {
        success: true,
        message: "test",
        reportId: 1,
      };

      // All responses should have success and message
      expect(linkResponse).toHaveProperty("success");
      expect(linkResponse).toHaveProperty("message");
      expect(unlinkResponse).toHaveProperty("success");
      expect(unlinkResponse).toHaveProperty("message");
      expect(createReportResponse).toHaveProperty("success");
      expect(createReportResponse).toHaveProperty("message");
    });

    it("should handle string telegramId consistently", () => {
      const linkRequest: TelegramLinkRequestDTO = {
        token: "test",
        telegramId: "123456789",
      };

      const createReportRequest: TelegramCreateReportRequestDTO = {
        telegramId: "123456789",
        title: "test",
        description: "test",
        category: "test",
        latitude: 0,
        longitude: 0,
      };

      expect(typeof linkRequest.telegramId).toBe("string");
      expect(typeof createReportRequest.telegramId).toBe("string");
      expect(linkRequest.telegramId).toBe(createReportRequest.telegramId);
    });
  });

  describe("Type safety tests", () => {
    it("should enforce required properties at compile time", () => {
      // These should not compile if properties are missing
      // (TypeScript compile-time test)
      
      const tokenResponse: TelegramTokenResponseDTO = {
        token: "test",
        expiresAt: "test",
        deepLink: "test",
        message: "test",
      };

      const linkRequest: TelegramLinkRequestDTO = {
        token: "test",
        telegramId: "test",
        // telegramUsername is optional
      };

      expect(tokenResponse).toBeDefined();
      expect(linkRequest).toBeDefined();
    });

    it("should allow optional properties to be undefined", () => {
      const reportRequest: TelegramCreateReportRequestDTO = {
        telegramId: "test",
        title: "test",
        description: "test",
        category: "test",
        latitude: 0,
        longitude: 0,
        // isAnonymous and photoFileIds are optional
      };

      expect(reportRequest.isAnonymous).toBeUndefined();
      expect(reportRequest.photoFileIds).toBeUndefined();
    });
  });
});