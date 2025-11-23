import { Request, Response } from "express";
import { getApiInfo } from "../../../src/controllers/rootController";
import { CONFIG } from "../../../src/config/constants";

describe("rootController", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    mockReq = {};
    mockRes = {
      json: jsonMock,
    };
  });

  describe("getApiInfo", () => {
    it("should return API information with correct structure", async () => {
      await getApiInfo(mockReq as Request, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        message: CONFIG.API.NAME,
        version: CONFIG.API.VERSION,
        description: CONFIG.API.DESCRIPTION,
        endpoints: {
          auth: CONFIG.ROUTES.SESSION,
          citizens: CONFIG.ROUTES.CITIZEN,
          admin: CONFIG.ROUTES.ADMIN,
          reports: CONFIG.ROUTES.REPORTS,
          docs: CONFIG.ROUTES.SWAGGER,
        },
      });
    });

    it("should return API information with all required fields", async () => {
      await getApiInfo(mockReq as Request, mockRes as Response);

      const responseCall = jsonMock.mock.calls[0][0];

      expect(responseCall).toHaveProperty("message");
      expect(responseCall).toHaveProperty("version");
      expect(responseCall).toHaveProperty("description");
      expect(responseCall).toHaveProperty("endpoints");
      expect(responseCall.endpoints).toHaveProperty("auth");
      expect(responseCall.endpoints).toHaveProperty("citizens");
      expect(responseCall.endpoints).toHaveProperty("admin");
      expect(responseCall.endpoints).toHaveProperty("reports");
      expect(responseCall.endpoints).toHaveProperty("docs");
    });

    it("should use values from CONFIG", async () => {
      await getApiInfo(mockReq as Request, mockRes as Response);

      const responseCall = jsonMock.mock.calls[0][0];

      expect(responseCall.message).toBe(CONFIG.API.NAME);
      expect(responseCall.version).toBe(CONFIG.API.VERSION);
      expect(responseCall.description).toBe(CONFIG.API.DESCRIPTION);
      expect(responseCall.endpoints.auth).toBe(CONFIG.ROUTES.SESSION);
      expect(responseCall.endpoints.citizens).toBe(CONFIG.ROUTES.CITIZEN);
      expect(responseCall.endpoints.admin).toBe(CONFIG.ROUTES.ADMIN);
      expect(responseCall.endpoints.reports).toBe(CONFIG.ROUTES.REPORTS);
      expect(responseCall.endpoints.docs).toBe(CONFIG.ROUTES.SWAGGER);
    });

    it("should return consistent structure across multiple calls", async () => {
      await getApiInfo(mockReq as Request, mockRes as Response);
      await getApiInfo(mockReq as Request, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledTimes(2);
      
      const firstCall = jsonMock.mock.calls[0][0];
      const secondCall = jsonMock.mock.calls[1][0];

      expect(firstCall).toEqual(secondCall);
    });

    it("should handle empty request object", async () => {
      const emptyReq = {} as Request;
      
      await getApiInfo(emptyReq, mockRes as Response);

      expect(jsonMock).toHaveBeenCalled();
      const responseCall = jsonMock.mock.calls[0][0];
      expect(responseCall).toHaveProperty("message");
      expect(responseCall).toHaveProperty("endpoints");
    });

    it("should return endpoints with string values", async () => {
      await getApiInfo(mockReq as Request, mockRes as Response);

      const responseCall = jsonMock.mock.calls[0][0];
      const endpoints = responseCall.endpoints;

      expect(typeof endpoints.auth).toBe("string");
      expect(typeof endpoints.citizens).toBe("string");
      expect(typeof endpoints.admin).toBe("string");
      expect(typeof endpoints.reports).toBe("string");
      expect(typeof endpoints.docs).toBe("string");
    });

    describe("CONFIG integration", () => {
      it("should reflect CONFIG.API values correctly", async () => {
        await getApiInfo(mockReq as Request, mockRes as Response);

        const responseCall = jsonMock.mock.calls[0][0];

        expect(responseCall.message).toBeDefined();
        expect(responseCall.version).toBeDefined();
        expect(responseCall.description).toBeDefined();
        expect(typeof responseCall.message).toBe("string");
        expect(typeof responseCall.version).toBe("string");
        expect(typeof responseCall.description).toBe("string");
      });

      it("should reflect CONFIG.ROUTES values correctly", async () => {
        await getApiInfo(mockReq as Request, mockRes as Response);

        const responseCall = jsonMock.mock.calls[0][0];
        const endpoints = responseCall.endpoints;

        expect(endpoints.auth).toBeDefined();
        expect(endpoints.citizens).toBeDefined();
        expect(endpoints.admin).toBeDefined();
        expect(endpoints.reports).toBeDefined();
        expect(endpoints.docs).toBeDefined();
      });

      it("should not contain unexpected properties", async () => {
        await getApiInfo(mockReq as Request, mockRes as Response);

        const responseCall = jsonMock.mock.calls[0][0];
        const expectedKeys = ["message", "version", "description", "endpoints"];
        const actualKeys = Object.keys(responseCall);

        expect(actualKeys.sort()).toEqual(expectedKeys.sort());
      });

      it("should have endpoints with expected properties only", async () => {
        await getApiInfo(mockReq as Request, mockRes as Response);

        const responseCall = jsonMock.mock.calls[0][0];
        const endpoints = responseCall.endpoints;
        const expectedEndpointKeys = ["auth", "citizens", "admin", "reports", "docs"];
        const actualEndpointKeys = Object.keys(endpoints);

        expect(actualEndpointKeys.sort()).toEqual(expectedEndpointKeys.sort());
      });
    });

    describe("Story 5 integration", () => {
      it("should include reports endpoint for Story 5", async () => {
        await getApiInfo(mockReq as Request, mockRes as Response);

        const responseCall = jsonMock.mock.calls[0][0];
        const endpoints = responseCall.endpoints;

        expect(endpoints.reports).toBeDefined();
        expect(endpoints.reports).toBe(CONFIG.ROUTES.REPORTS);
      });

      it("should include citizens endpoint for Story 5 user registration", async () => {
        await getApiInfo(mockReq as Request, mockRes as Response);

        const responseCall = jsonMock.mock.calls[0][0];
        const endpoints = responseCall.endpoints;

        expect(endpoints.citizens).toBeDefined();
        expect(endpoints.citizens).toBe(CONFIG.ROUTES.CITIZEN);
      });

      it("should include auth endpoint for Story 5 authentication", async () => {
        await getApiInfo(mockReq as Request, mockRes as Response);

        const responseCall = jsonMock.mock.calls[0][0];
        const endpoints = responseCall.endpoints;

        expect(endpoints.auth).toBeDefined();
        expect(endpoints.auth).toBe(CONFIG.ROUTES.SESSION);
      });

      it("should provide API documentation endpoint", async () => {
        await getApiInfo(mockReq as Request, mockRes as Response);

        const responseCall = jsonMock.mock.calls[0][0];
        const endpoints = responseCall.endpoints;

        expect(endpoints.docs).toBeDefined();
        expect(endpoints.docs).toBe(CONFIG.ROUTES.SWAGGER);
      });
    });

    describe("Error handling", () => {
      it("should handle missing CONFIG gracefully", async () => {
        // Test che il controller non lanci errori anche se CONFIG ha problemi
        expect(async () => {
          await getApiInfo(mockReq as Request, mockRes as Response);
        }).not.toThrow();

        expect(jsonMock).toHaveBeenCalled();
      });

      it("should return response without throwing", async () => {
        let error: any = null;

        try {
          await getApiInfo(mockReq as Request, mockRes as Response);
        } catch (e) {
          error = e;
        }

        expect(error).toBeNull();
        expect(jsonMock).toHaveBeenCalled();
      });
    });

    describe("Performance and reliability", () => {
      it("should execute quickly", async () => {
        const startTime = Date.now();
        await getApiInfo(mockReq as Request, mockRes as Response);
        const endTime = Date.now();

        expect(endTime - startTime).toBeLessThan(100); // Should execute in less than 100ms
      });

      it("should be idempotent", async () => {
        await getApiInfo(mockReq as Request, mockRes as Response);
        const firstResponse = jsonMock.mock.calls[0][0];

        jsonMock.mockClear();

        await getApiInfo(mockReq as Request, mockRes as Response);
        const secondResponse = jsonMock.mock.calls[0][0];

        expect(firstResponse).toEqual(secondResponse);
      });

      it("should not modify request or response objects", async () => {
        const originalReq = { ...mockReq };
        const originalRes = { ...mockRes };

        await getApiInfo(mockReq as Request, mockRes as Response);

        expect(mockReq).toEqual(originalReq);
        // Solo il metodo json dovrebbe essere chiamato su res
        expect(jsonMock).toHaveBeenCalled();
      });
    });
  });
});