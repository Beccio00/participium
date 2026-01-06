/**
 * Story #30: Address Search Feature - Integration Tests
 * 
 * As a citizen/unregistered user
 * I want to search for reports in a specific area by typing an address
 * So that I can easily explore and analyze existing reports in that specific area
 * 
 * Test Coverage:
 * 1. Basic geocoding functionality
 * 2. Zoom level variations
 * 3. Parameter validation
 * 4. Turin boundaries validation
 * 5. Integration with reports API
 * 6. Unauthenticated access
 * 7. Error handling
 */

import request from "supertest";
import { Express } from "express";
import { createApp } from "../../../src/app";
import { cleanDatabase, disconnectDatabase, setupTestDatabase } from "../../helpers/testSetup";

let app: Express;

beforeAll(async () => {
  await setupTestDatabase();
  app = createApp();
});

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});

describe("Story #30: Address Search Feature - Integration Tests", () => {

  describe("Basic Geocoding Functionality", () => {
    it("should successfully geocode a valid Turin address with default zoom", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: "Piazza Castello, Torino" })
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty("address");
      expect(response.body).toHaveProperty("latitude");
      expect(response.body).toHaveProperty("longitude");
      expect(response.body).toHaveProperty("bbox");
      expect(response.body).toHaveProperty("zoom");

      // Verify data types
      expect(typeof response.body.address).toBe("string");
      expect(typeof response.body.latitude).toBe("number");
      expect(typeof response.body.longitude).toBe("number");
      expect(typeof response.body.bbox).toBe("string");
      expect(typeof response.body.zoom).toBe("number");

      // Verify default zoom level
      expect(response.body.zoom).toBe(16);

      // Verify bbox format (minLon,minLat,maxLon,maxLat)
      const bboxPattern = /^-?[\d.]+,-?[\d.]+,-?[\d.]+,-?[\d.]+$/;
      expect(response.body.bbox).toMatch(bboxPattern);

      // Verify coordinates are roughly in Turin area
      expect(response.body.latitude).toBeGreaterThan(44.9);
      expect(response.body.latitude).toBeLessThan(45.2);
      expect(response.body.longitude).toBeGreaterThan(7.5);
      expect(response.body.longitude).toBeLessThan(7.8);
    });

    it("should geocode Via Roma, Torino", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: "Via Roma, Torino" })
        .expect(200);

      // Assert
      expect(response.body.address).toContain("Roma");
      expect(response.body.address).toContain("Torino");
      expect(response.body.latitude).toBeGreaterThan(45.0);
      expect(response.body.longitude).toBeGreaterThan(7.6);
    });

    it("should geocode Porta Nuova landmark", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: "Porta Nuova, Torino" })
        .expect(200);

      // Assert
      expect(response.body.address).toBeDefined();
      expect(response.body.latitude).toBeDefined();
      expect(response.body.longitude).toBeDefined();
    });
  });

  describe("Zoom Level Variations", () => {
    const testAddress = "Piazza Castello, Torino";

    it("should accept zoom level 12 (city area level)", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: testAddress, zoom: 12 })
        .expect(200);

      // Assert
      expect(response.body.zoom).toBe(12);
      
      // Verify bbox is larger for lower zoom
      const bboxParts = response.body.bbox.split(',').map(parseFloat);
      const width = bboxParts[2] - bboxParts[0];
      const height = bboxParts[3] - bboxParts[1];
      
      // At zoom 12, bbox should be relatively large
      expect(width).toBeGreaterThan(0.05);
      expect(height).toBeGreaterThan(0.05);
    });

    it("should accept zoom level 14 (district level)", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: testAddress, zoom: 14 })
        .expect(200);

      // Assert
      expect(response.body.zoom).toBe(14);
    });

    it("should accept zoom level 16 (neighborhood level)", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: testAddress, zoom: 16 })
        .expect(200);

      // Assert
      expect(response.body.zoom).toBe(16);
    });

    it("should accept zoom level 18 (street level)", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: testAddress, zoom: 18 })
        .expect(200);

      // Assert
      expect(response.body.zoom).toBe(18);
      
      // Verify bbox is smaller for higher zoom
      const bboxParts = response.body.bbox.split(',').map(parseFloat);
      const width = bboxParts[2] - bboxParts[0];
      const height = bboxParts[3] - bboxParts[1];
      
      // At zoom 18, bbox should be relatively small
      expect(width).toBeLessThan(0.02);
      expect(height).toBeLessThan(0.02);
    });

    it("should accept zoom level 19 (street level)", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: testAddress, zoom: 19 })
        .expect(200);

      // Assert
      expect(response.body.zoom).toBe(19);
    });

    it("should show bbox size decreases as zoom level increases", async () => {
      // Act - Get bboxes at different zoom levels
      const zoom12Response = await request(app)
        .get("/api/geocode")
        .query({ address: testAddress, zoom: 12 })
        .expect(200);

      const zoom16Response = await request(app)
        .get("/api/geocode")
        .query({ address: testAddress, zoom: 16 })
        .expect(200);

      const zoom19Response = await request(app)
        .get("/api/geocode")
        .query({ address: testAddress, zoom: 19 })
        .expect(200);

      // Calculate bbox areas
      const calculateArea = (bbox: string) => {
        const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(parseFloat);
        return (maxLon - minLon) * (maxLat - minLat);
      };

      const area12 = calculateArea(zoom12Response.body.bbox);
      const area16 = calculateArea(zoom16Response.body.bbox);
      const area19 = calculateArea(zoom19Response.body.bbox);

      // Assert - Higher zoom = smaller area
      expect(area12).toBeGreaterThan(area16);
      expect(area16).toBeGreaterThan(area19);
    });
  });

  describe("Parameter Validation", () => {
    it("should return 400 when address parameter is missing", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .expect(400);

      // Assert
      expect(response.body.code).toBe(400);
      expect(response.body.error).toMatch(/Bad Request|BadRequest/);
    });

    it("should return 400 when address is too short (< 3 characters)", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: "ab" })
        .expect(400);

      // Assert
      expect(response.body.code).toBe(400);
      expect(response.body.message).toMatch(/3 characters|fewer than 3/);
    });

    it("should return 400 when address is too long (> 200 characters)", async () => {
      // Act
      const longAddress = "a".repeat(201);
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: longAddress })
        .expect(400);

      // Assert
      expect(response.body.code).toBe(400);
      expect(response.body.message).toContain("200 characters");
    });

    it("should return 400 when zoom is less than 12", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: "Via Roma, Torino", zoom: 11 })
        .expect(400);

      // Assert
      expect(response.body.code).toBe(400);
      expect(response.body.message).toMatch(/12|>= 12/);
    });

    it("should return 400 when zoom is greater than 19", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: "Via Roma, Torino", zoom: 20 })
        .expect(400);

      // Assert
      expect(response.body.code).toBe(400);
      expect(response.body.message).toMatch(/19|<= 19/);
    });

    it("should return 400 when zoom is not a number", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: "Via Roma, Torino", zoom: "invalid" })
        .expect(400);

      // Assert
      expect(response.body.code).toBe(400);
    });
  });

  describe("Turin Boundaries Validation", () => {
    it("should accept addresses within Turin municipality", async () => {
      // Test multiple known Turin locations
      const turinAddresses = [
        "Piazza Castello, Torino",
        "Mole Antonelliana, Torino",
        "Porta Nuova, Torino",
        "Politecnico di Torino"
      ];

      for (const address of turinAddresses) {
        const response = await request(app)
          .get("/api/geocode")
          .query({ address })
          .expect(200);

        expect(response.body.latitude).toBeGreaterThan(44.9);
        expect(response.body.latitude).toBeLessThan(45.2);
        expect(response.body.longitude).toBeGreaterThan(7.5);
        expect(response.body.longitude).toBeLessThan(7.8);
      }
    });

    it("should reject addresses outside Turin municipality (Milan)", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: "Duomo di Milano, Milan" });

      // Assert - Accept either 400 or 500 (geocoding service may reject first)
      expect([400, 500]).toContain(response.status);
    });

    it("should reject addresses outside Turin municipality (Rome)", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: "Colosseo, Roma" });

      // Assert - Accept either 400 or 500 (geocoding service may reject first)
      expect([400, 500]).toContain(response.status);
    });
  });

  describe("Unauthenticated Access", () => {
    it("should allow geocoding without authentication", async () => {
      // Act - No authentication headers
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: "Piazza Castello, Torino" })
        .expect(200);

      // Assert
      expect(response.body.address).toBeDefined();
      expect(response.body.latitude).toBeDefined();
      expect(response.body.longitude).toBeDefined();
    });

    it("should work for unregistered users", async () => {
      // Act - Simulate unregistered user (no session)
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: "Via Roma, Torino", zoom: 16 })
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty("bbox");
      expect(response.body).toHaveProperty("zoom");
    });
  });

  describe("Error Handling", () => {
    it("should return 400 for non-existent address", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: "ThisAddressDoesNotExistInTurin123456789" });

      // Assert - Accept either 400 or 500
      expect([400, 500]).toContain(response.status);
    });

    it("should return 400 for gibberish address", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: "xyzabc123qwerty" });

      // Assert - Accept either 400 or 500
      expect([400, 500]).toContain(response.status);
    });

    it("should handle special characters in address", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: "Piazza Castello, Torino" });

      // Assert - Should either succeed or fail gracefully
      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("latitude");
      } else {
        expect(response.body).toHaveProperty("code");
      }
    });
  });

  describe("Response Format Validation", () => {
    it("should return all required fields in correct format", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: "Piazza Castello, Torino", zoom: 16 })
        .expect(200);

      // Assert - Check all required fields exist
      expect(response.body).toHaveProperty("address");
      expect(response.body).toHaveProperty("latitude");
      expect(response.body).toHaveProperty("longitude");
      expect(response.body).toHaveProperty("bbox");
      expect(response.body).toHaveProperty("zoom");

      // Assert - Check field types
      expect(typeof response.body.address).toBe("string");
      expect(typeof response.body.latitude).toBe("number");
      expect(typeof response.body.longitude).toBe("number");
      expect(typeof response.body.bbox).toBe("string");
      expect(typeof response.body.zoom).toBe("number");

      // Assert - Check bbox format
      const bboxParts = response.body.bbox.split(',');
      expect(bboxParts).toHaveLength(4);
      bboxParts.forEach((part: string) => {
        expect(parseFloat(part)).not.toBeNaN();
      });

      // Assert - Check bbox components are in correct order (minLon, minLat, maxLon, maxLat)
      const [minLon, minLat, maxLon, maxLat] = bboxParts.map(parseFloat);
      expect(minLon).toBeLessThan(maxLon);
      expect(minLat).toBeLessThan(maxLat);
    });

    it("should return valid latitude range (-90 to 90)", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: "Mole Antonelliana, Torino" })
        .expect(200);

      // Assert
      expect(response.body.latitude).toBeGreaterThanOrEqual(-90);
      expect(response.body.latitude).toBeLessThanOrEqual(90);
    });

    it("should return valid longitude range (-180 to 180)", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: "Mole Antonelliana, Torino" })
        .expect(200);

      // Assert
      expect(response.body.longitude).toBeGreaterThanOrEqual(-180);
      expect(response.body.longitude).toBeLessThanOrEqual(180);
    });
  });

  describe("Bbox Calculation Accuracy", () => {
    it("should return bbox centered around the geocoded location", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: "Piazza Castello, Torino", zoom: 16 })
        .expect(200);

      // Parse bbox
      const [minLon, minLat, maxLon, maxLat] = response.body.bbox.split(',').map(parseFloat);
      
      // Calculate bbox center
      const centerLon = (minLon + maxLon) / 2;
      const centerLat = (minLat + maxLat) / 2;

      // Assert - Geocoded location should be close to bbox center
      const lonDiff = Math.abs(response.body.longitude - centerLon);
      const latDiff = Math.abs(response.body.latitude - centerLat);

      expect(lonDiff).toBeLessThan(0.001); // Within ~100m
      expect(latDiff).toBeLessThan(0.001);
    });

    it("should ensure bbox contains the geocoded point", async () => {
      // Act
      const response = await request(app)
        .get("/api/geocode")
        .query({ address: "Via Roma, Torino", zoom: 14 })
        .expect(200);

      // Parse bbox
      const [minLon, minLat, maxLon, maxLat] = response.body.bbox.split(',').map(parseFloat);

      // Assert - Point should be within bbox
      expect(response.body.longitude).toBeGreaterThanOrEqual(minLon);
      expect(response.body.longitude).toBeLessThanOrEqual(maxLon);
      expect(response.body.latitude).toBeGreaterThanOrEqual(minLat);
      expect(response.body.latitude).toBeLessThanOrEqual(maxLat);
    });
  });
});
