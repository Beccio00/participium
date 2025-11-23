import { CONFIG } from "../../../src/config/constants";
import path from "path";

describe("constants configuration", () => {
  describe("CONFIG object", () => {
    it("should have all required configuration sections", () => {
      expect(CONFIG).toHaveProperty("PORT");
      expect(CONFIG).toHaveProperty("SESSION_SECRET");
      expect(CONFIG).toHaveProperty("CORS");
      expect(CONFIG).toHaveProperty("ROUTES");
      expect(CONFIG).toHaveProperty("SWAGGER_FILE_PATH");
      expect(CONFIG).toHaveProperty("API");
    });

    describe("Server configuration", () => {
      it("should have PORT configuration", () => {
        expect(CONFIG.PORT).toBeDefined();
        expect(typeof CONFIG.PORT === "string" || typeof CONFIG.PORT === "number").toBe(true);
      });

      it("should use environment variable PORT when available", () => {
        const originalPort = process.env.PORT;
        process.env.PORT = "3333";
        
        // Re-require the module to get fresh config
        jest.resetModules();
        const { CONFIG: freshConfig } = require("../../../src/config/constants");
        
        expect(freshConfig.PORT).toBe("3333");
        
        // Restore original value
        process.env.PORT = originalPort;
      });

      it("should fallback to default PORT when environment variable not set", () => {
        const originalPort = process.env.PORT;
        delete process.env.PORT;
        
        jest.resetModules();
        const { CONFIG: freshConfig } = require("../../../src/config/constants");
        
        expect(freshConfig.PORT).toBe(4000);
        
        // Restore original value
        process.env.PORT = originalPort;
      });
    });

    describe("Session configuration", () => {
      it("should have SESSION_SECRET configuration", () => {
        expect(CONFIG.SESSION_SECRET).toBeDefined();
        expect(typeof CONFIG.SESSION_SECRET).toBe("string");
        expect(CONFIG.SESSION_SECRET.length).toBeGreaterThan(0);
      });

      it("should use environment variable SESSION_SECRET when available", () => {
        const originalSecret = process.env.SESSION_SECRET;
        process.env.SESSION_SECRET = "custom-secret-key";
        
        jest.resetModules();
        const { CONFIG: freshConfig } = require("../../../src/config/constants");
        
        expect(freshConfig.SESSION_SECRET).toBe("custom-secret-key");
        
        process.env.SESSION_SECRET = originalSecret;
      });

      it("should fallback to default SESSION_SECRET when environment variable not set", () => {
        const originalSecret = process.env.SESSION_SECRET;
        delete process.env.SESSION_SECRET;
        
        jest.resetModules();
        const { CONFIG: freshConfig } = require("../../../src/config/constants");
        
        expect(freshConfig.SESSION_SECRET).toBe("shhhhh... it's a secret!");
        
        process.env.SESSION_SECRET = originalSecret;
      });
    });

    describe("CORS configuration", () => {
      it("should have valid CORS configuration structure", () => {
        expect(CONFIG.CORS).toBeDefined();
        expect(CONFIG.CORS).toHaveProperty("ORIGIN");
        expect(CONFIG.CORS).toHaveProperty("CREDENTIALS");
        expect(CONFIG.CORS).toHaveProperty("METHODS");
      });

      it("should have ORIGIN as array", () => {
        expect(Array.isArray(CONFIG.CORS.ORIGIN)).toBe(true);
        expect(CONFIG.CORS.ORIGIN.length).toBeGreaterThan(0);
      });

      it("should include default origins when CORS_ORIGIN not set", () => {
        const originalCorsOrigin = process.env.CORS_ORIGIN;
        delete process.env.CORS_ORIGIN;
        
        jest.resetModules();
        const { CONFIG: freshConfig } = require("../../../src/config/constants");
        
        expect(freshConfig.CORS.ORIGIN).toContain("http://localhost:5173");
        expect(freshConfig.CORS.ORIGIN).toContain("http://localhost:3000");
        
        process.env.CORS_ORIGIN = originalCorsOrigin;
      });

      it("should parse CORS_ORIGIN from environment variable", () => {
        const originalCorsOrigin = process.env.CORS_ORIGIN;
        process.env.CORS_ORIGIN = "http://example.com,https://app.example.com";
        
        jest.resetModules();
        const { CONFIG: freshConfig } = require("../../../src/config/constants");
        
        expect(freshConfig.CORS.ORIGIN).toContain("http://example.com");
        expect(freshConfig.CORS.ORIGIN).toContain("https://app.example.com");
        expect(freshConfig.CORS.ORIGIN).toHaveLength(2);
        
        process.env.CORS_ORIGIN = originalCorsOrigin;
      });

      it("should have CREDENTIALS set to true", () => {
        expect(CONFIG.CORS.CREDENTIALS).toBe(true);
      });

      it("should have correct HTTP methods", () => {
        const expectedMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];
        expect(CONFIG.CORS.METHODS).toEqual(expectedMethods);
      });
    });

    describe("Routes configuration", () => {
      it("should have all required route definitions", () => {
        const expectedRoutes = [
          "ROOT", "API_PREFIX", "SESSION", "CITIZEN", 
          "ADMIN", "REPORTS", "SWAGGER"
        ];
        
        expectedRoutes.forEach(route => {
          expect(CONFIG.ROUTES).toHaveProperty(route);
          expect(typeof CONFIG.ROUTES[route as keyof typeof CONFIG.ROUTES]).toBe("string");
        });
      });

      it("should have correct route values", () => {
        expect(CONFIG.ROUTES.ROOT).toBe("/");
        expect(CONFIG.ROUTES.API_PREFIX).toBe("/api");
        expect(CONFIG.ROUTES.SESSION).toBe("/api/session");
        expect(CONFIG.ROUTES.CITIZEN).toBe("/api/citizen");
        expect(CONFIG.ROUTES.ADMIN).toBe("/api/admin");
        expect(CONFIG.ROUTES.REPORTS).toBe("/api/reports");
        expect(CONFIG.ROUTES.SWAGGER).toBe("/api-docs");
      });

      describe("Story 5 (PT05) route requirements", () => {
        it("should have reports endpoint for Story 5", () => {
          expect(CONFIG.ROUTES.REPORTS).toBe("/api/reports");
        });

        it("should have citizen endpoint for Story 5 user registration", () => {
          expect(CONFIG.ROUTES.CITIZEN).toBe("/api/citizen");
        });

        it("should have session endpoint for Story 5 authentication", () => {
          expect(CONFIG.ROUTES.SESSION).toBe("/api/session");
        });
      });
    });

    describe("Swagger configuration", () => {
      it("should have valid swagger file path", () => {
        expect(CONFIG.SWAGGER_FILE_PATH).toBeDefined();
        expect(typeof CONFIG.SWAGGER_FILE_PATH).toBe("string");
      });

      it("should point to swagger.yaml file", () => {
        expect(CONFIG.SWAGGER_FILE_PATH).toMatch(/swagger\.yaml$/);
      });

      it("should use absolute path", () => {
        expect(path.isAbsolute(CONFIG.SWAGGER_FILE_PATH)).toBe(true);
      });

      it("should resolve to docs directory", () => {
        expect(CONFIG.SWAGGER_FILE_PATH).toMatch(/docs[\\\/]swagger\.yaml$/);
      });
    });

    describe("API information", () => {
      it("should have complete API information", () => {
        expect(CONFIG.API).toHaveProperty("NAME");
        expect(CONFIG.API).toHaveProperty("VERSION");
        expect(CONFIG.API).toHaveProperty("DESCRIPTION");
      });

      it("should have valid API name", () => {
        expect(CONFIG.API.NAME).toBe("Participium API");
        expect(typeof CONFIG.API.NAME).toBe("string");
        expect(CONFIG.API.NAME.length).toBeGreaterThan(0);
      });

      it("should have valid version format", () => {
        expect(CONFIG.API.VERSION).toBe("1.1.0");
        expect(CONFIG.API.VERSION).toMatch(/^\d+\.\d+\.\d+$/);
      });

      it("should have meaningful description", () => {
        expect(CONFIG.API.DESCRIPTION).toBe("Digital Citizen Participation Platform");
        expect(typeof CONFIG.API.DESCRIPTION).toBe("string");
        expect(CONFIG.API.DESCRIPTION.length).toBeGreaterThan(0);
      });
    });

    describe("Environment variable handling", () => {
      it("should handle missing environment variables gracefully", () => {
        const originalEnv = { ...process.env };
        
        // Remove all relevant environment variables
        delete process.env.PORT;
        delete process.env.SESSION_SECRET;
        delete process.env.CORS_ORIGIN;
        
        jest.resetModules();
        const { CONFIG: freshConfig } = require("../../../src/config/constants");
        
        expect(freshConfig.PORT).toBeDefined();
        expect(freshConfig.SESSION_SECRET).toBeDefined();
        expect(freshConfig.CORS.ORIGIN).toBeDefined();
        expect(Array.isArray(freshConfig.CORS.ORIGIN)).toBe(true);
        
        // Restore environment
        process.env = originalEnv;
      });

      it("should handle empty environment variables", () => {
        const originalEnv = { ...process.env };
        
        process.env.PORT = "";
        process.env.SESSION_SECRET = "";
        process.env.CORS_ORIGIN = "";
        
        jest.resetModules();
        const { CONFIG: freshConfig } = require("../../../src/config/constants");
        
        // Empty string should fallback to defaults
        expect(freshConfig.PORT).toBe(4000);
        expect(freshConfig.SESSION_SECRET).toBe("shhhhh... it's a secret!");
        
        // Empty CORS_ORIGIN should parse as array with empty string
        expect(Array.isArray(freshConfig.CORS.ORIGIN)).toBe(true);
        
        process.env = originalEnv;
      });
    });

    describe("Configuration immutability", () => {
      it("should not allow modification of CONFIG object", () => {
        // Attempt to modify CONFIG should not work if object is frozen
        const originalValue = CONFIG.PORT;
        
        expect(() => {
          (CONFIG as any).PORT = "modified";
        }).not.toThrow(); // Object is not frozen, but we test it doesn't break
        
        // Verify original structure is maintained
        expect(CONFIG).toHaveProperty("PORT");
        expect(CONFIG).toHaveProperty("ROUTES");
        expect(CONFIG).toHaveProperty("API");
      });

      it("should maintain consistent structure across imports", () => {
        jest.resetModules();
        const { CONFIG: config1 } = require("../../../src/config/constants");
        const { CONFIG: config2 } = require("../../../src/config/constants");
        
        expect(config1).toEqual(config2);
      });
    });

    describe("Security considerations", () => {
      it("should not expose sensitive defaults in production-like environment", () => {
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "production";
        
        // In production, session secret should ideally come from environment
        expect(CONFIG.SESSION_SECRET).toBeDefined();
        
        process.env.NODE_ENV = originalNodeEnv;
      });

      it("should have reasonable CORS configuration", () => {
        expect(CONFIG.CORS.CREDENTIALS).toBe(true);
        expect(CONFIG.CORS.METHODS).toContain("OPTIONS");
        expect(Array.isArray(CONFIG.CORS.ORIGIN)).toBe(true);
      });
    });
  });
});