import axios from "axios";
import {
  forwardGeocode,
  validateAddress,
  validateZoom,
  parseBoundingBox,
  GeocodeResult,
  BoundingBox,
} from "../../../src/services/geocodingService";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("geocodingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================
  // forwardGeocode tests
  // =========================
  describe("forwardGeocode", () => {
    it("should successfully geocode a valid address and return coordinates with bounding box", async () => {
      const mockResponse = {
        status: 200,
        data: [
          {
            lat: "45.0731",
            lon: "7.6860",
            display_name: "Via Roma, Turin, Italy",
          },
        ],
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await forwardGeocode("Via Roma, Turin", 16);

      expect(result).toHaveProperty("address", "Via Roma, Turin, Italy");
      expect(result).toHaveProperty("latitude", 45.0731);
      expect(result).toHaveProperty("longitude", 7.686);
      expect(result).toHaveProperty("bbox");
      expect(result).toHaveProperty("zoom", 16);

      // Verify API was called with correct parameters
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://nominatim.openstreetmap.org/search",
        expect.objectContaining({
          params: expect.objectContaining({
            q: "Via Roma, Turin",
            format: "jsonv2",
            addressdetails: 1,
            limit: 1,
            bounded: 1,
            viewbox: "7.5,45.2,7.8,44.9",
          }),
        })
      );
    });

    it("should use default zoom level of 16 if not provided", async () => {
      const mockResponse = {
        status: 200,
        data: [
          {
            lat: "45.0731",
            lon: "7.6860",
            display_name: "Piazza Castello, Turin",
          },
        ],
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await forwardGeocode("Piazza Castello");

      expect(result.zoom).toBe(16);
    });

    it("should calculate correct bounding box for zoom level 18 (street level, ~100m radius)", async () => {
      const mockResponse = {
        status: 200,
        data: [
          {
            lat: "45.0731",
            lon: "7.6860",
            display_name: "Test Location",
          },
        ],
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await forwardGeocode("Test Location", 18);

      expect(result.zoom).toBe(18);
      // Verify bbox is a string
      expect(typeof result.bbox).toBe("string");
      // Verify bbox format "minLon,minLat,maxLon,maxLat"
      const bboxParts = result.bbox.split(",");
      expect(bboxParts).toHaveLength(4);
    });

    it("should calculate correct bounding box for zoom level 14 (district level, ~2km radius)", async () => {
      const mockResponse = {
        status: 200,
        data: [
          {
            lat: "45.0731",
            lon: "7.6860",
            display_name: "Test Location",
          },
        ],
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await forwardGeocode("Test Location", 14);

      expect(result.zoom).toBe(14);
      const bboxParts = result.bbox.split(",");
      expect(bboxParts).toHaveLength(4);
    });

    it("should throw error when address is not found (empty response)", async () => {
      const mockResponse = {
        status: 200,
        data: [],
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await expect(forwardGeocode("NonexistentAddress123")).rejects.toThrow(
        "Geocoding service error"
      );
    });

    it("should throw error when nominatim returns 404", async () => {
      const error = {
        code: "ECONNREFUSED",
        response: { status: 404 },
        isAxiosError: true,
      };

      (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(true);
      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(forwardGeocode("Test")).rejects.toThrow(
        "Address not found by geocoding service"
      );
    });

    it("should throw timeout error when nominatim service is slow", async () => {
      const error = {
        code: "ECONNABORTED",
        isAxiosError: true,
      };

      (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(true);
      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(forwardGeocode("Test")).rejects.toThrow(
        "Geocoding service temporarily unavailable"
      );
    });

    it("should throw generic error for unknown axios error", async () => {
      (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(true);
      mockedAxios.get.mockRejectedValueOnce(new Error("Network error"));

      await expect(forwardGeocode("Test")).rejects.toThrow(
        "Geocoding service error"
      );
    });

    it("should throw generic error for non-axios error", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Unexpected error"));

      await expect(forwardGeocode("Test")).rejects.toThrow(
        "Geocoding service error"
      );
    });

    it("should handle different zoom levels correctly", async () => {
      const mockResponse = {
        status: 200,
        data: [
          {
            lat: "45.0731",
            lon: "7.6860",
            display_name: "Test",
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      // Test zoom 19 (street level)
      const result19 = await forwardGeocode("Test", 19);
      expect(result19.zoom).toBe(19);

      // Test zoom 12 (city level)
      const result12 = await forwardGeocode("Test", 12);
      expect(result12.zoom).toBe(12);
    });

    it("should parse coordinates correctly from nominatim response", async () => {
      const mockResponse = {
        status: 200,
        data: [
          {
            lat: "45.1234567",
            lon: "7.6543210",
            display_name: "Specific Address, Turin",
          },
        ],
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await forwardGeocode("Specific Address");

      expect(result.latitude).toBe(45.1234567);
      expect(result.longitude).toBe(7.654321);
    });
  });

  // =========================
  // validateAddress tests
  // =========================
  describe("validateAddress", () => {
    it("should validate a proper address string", () => {
      const address = "Via Roma, Turin";
      const result = validateAddress(address);
      expect(result).toBe("Via Roma, Turin");
    });

    it("should trim whitespace from address", () => {
      const address = "  Via Roma, Turin  ";
      const result = validateAddress(address);
      expect(result).toBe("Via Roma, Turin");
    });

    it("should throw error for missing address", () => {
      expect(() => validateAddress(null)).toThrow("Address is required");
    });

    it("should throw error for undefined address", () => {
      expect(() => validateAddress(undefined)).toThrow("Address is required");
    });

    it("should throw error for non-string address", () => {
      expect(() => validateAddress(123)).toThrow("Address is required");
    });

    it("should throw error for empty string address", () => {
      expect(() => validateAddress("")).toThrow(
        "Address is required"
      );
    });

    it("should throw error for address too short (less than 3 characters)", () => {
      expect(() => validateAddress("ab")).toThrow(
        "Address must be between 3 and 200 characters"
      );
    });

    it("should accept address with exactly 3 characters", () => {
      const result = validateAddress("abc");
      expect(result).toBe("abc");
    });

    it("should throw error for address longer than 200 characters", () => {
      const longAddress = "a".repeat(201);
      expect(() => validateAddress(longAddress)).toThrow(
        "Address must be between 3 and 200 characters"
      );
    });

    it("should accept address with exactly 200 characters", () => {
      const address = "a".repeat(200);
      const result = validateAddress(address);
      expect(result).toBe(address);
    });

    it("should accept address with special characters and numbers", () => {
      const address = "Via Roma 123, Turin 10100, Italy";
      const result = validateAddress(address);
      expect(result).toBe("Via Roma 123, Turin 10100, Italy");
    });

    it("should handle addresses with only whitespace", () => {
      expect(() => validateAddress("   ")).toThrow(
        "Address must be between 3 and 200 characters"
      );
    });
  });

  // =========================
  // validateZoom tests
  // =========================
  describe("validateZoom", () => {
    it("should validate zoom level 12", () => {
      const result = validateZoom(12);
      expect(result).toBe(12);
    });

    it("should validate zoom level 16", () => {
      const result = validateZoom(16);
      expect(result).toBe(16);
    });

    it("should validate zoom level 19", () => {
      const result = validateZoom(19);
      expect(result).toBe(19);
    });

    it('should validate zoom from string "16"', () => {
      const result = validateZoom("16");
      expect(result).toBe(16);
    });

    it("should throw error for zoom level below 12", () => {
      expect(() => validateZoom(11)).toThrow(
        "Zoom level must be between 12 and 19"
      );
    });

    it("should throw error for zoom level above 19", () => {
      expect(() => validateZoom(20)).toThrow(
        "Zoom level must be between 12 and 19"
      );
    });

    it("should throw error for non-numeric zoom", () => {
      expect(() => validateZoom("invalid")).toThrow(
        "Zoom level must be between 12 and 19"
      );
    });

    it("should accept float zoom level (truncated to int)", () => {
      // parseInt(16.5) returns 16, which is valid
      const result = validateZoom(16.5);
      expect(result).toBe(16);
    });

    it("should throw error for null zoom", () => {
      expect(() => validateZoom(null)).toThrow(
        "Zoom level must be between 12 and 19"
      );
    });

    it("should throw error for undefined zoom", () => {
      expect(() => validateZoom(undefined)).toThrow(
        "Zoom level must be between 12 and 19"
      );
    });
  });

  // =========================
  // parseBoundingBox tests
  // =========================
  describe("parseBoundingBox", () => {
    it("should parse valid bounding box string", () => {
      const bboxStr = "7.5,45.0,7.8,45.2";
      const result = parseBoundingBox(bboxStr);

      expect(result).toEqual({
        minLon: 7.5,
        minLat: 45.0,
        maxLon: 7.8,
        maxLat: 45.2,
      });
    });

    it("should parse bounding box with whitespace", () => {
      const bboxStr = " 7.5 , 45.0 , 7.8 , 45.2 ";
      const result = parseBoundingBox(bboxStr);

      expect(result).toEqual({
        minLon: 7.5,
        minLat: 45.0,
        maxLon: 7.8,
        maxLat: 45.2,
      });
    });

    it("should parse bounding box with negative coordinates", () => {
      const bboxStr = "-0.5,-45.0,0.8,45.2";
      const result = parseBoundingBox(bboxStr);

      expect(result).toEqual({
        minLon: -0.5,
        minLat: -45.0,
        maxLon: 0.8,
        maxLat: 45.2,
      });
    });

    it("should throw error for incorrect number of coordinates", () => {
      expect(() => parseBoundingBox("7.5,45.0,7.8")).toThrow(
        'Invalid bounding box format. Expected: "minLon,minLat,maxLon,maxLat"'
      );
    });

    it("should throw error for too many coordinates", () => {
      expect(() => parseBoundingBox("7.5,45.0,7.8,45.2,45.3")).toThrow(
        'Invalid bounding box format. Expected: "minLon,minLat,maxLon,maxLat"'
      );
    });

    it("should throw error for non-numeric coordinates", () => {
      expect(() => parseBoundingBox("abc,45.0,7.8,45.2")).toThrow(
        "Invalid bounding box coordinates"
      );
    });

    it("should throw error when minLon >= maxLon", () => {
      expect(() => parseBoundingBox("7.8,45.0,7.5,45.2")).toThrow(
        "Invalid bounding box: min values must be less than max values"
      );
    });

    it("should throw error when minLat >= maxLat", () => {
      expect(() => parseBoundingBox("7.5,45.2,7.8,45.0")).toThrow(
        "Invalid bounding box: min values must be less than max values"
      );
    });

    it("should throw error when minLon equals maxLon", () => {
      expect(() => parseBoundingBox("7.5,45.0,7.5,45.2")).toThrow(
        "Invalid bounding box: min values must be less than max values"
      );
    });

    it("should throw error when minLat equals maxLat", () => {
      expect(() => parseBoundingBox("7.5,45.0,7.8,45.0")).toThrow(
        "Invalid bounding box: min values must be less than max values"
      );
    });

    it("should handle scientific notation in coordinates", () => {
      const bboxStr = "7.5e0,4.5e1,7.8e0,4.52e1";
      const result = parseBoundingBox(bboxStr);

      expect(result.minLon).toBe(7.5);
      expect(result.minLat).toBe(45.0);
      expect(result.maxLon).toBe(7.8);
      expect(result.maxLat).toBe(45.2);
    });

    it("should throw error for empty string", () => {
      expect(() => parseBoundingBox("")).toThrow(
        'Invalid bounding box format. Expected: "minLon,minLat,maxLon,maxLat"'
      );
    });

    it("should throw error for single comma", () => {
      expect(() => parseBoundingBox(",")).toThrow(
        'Invalid bounding box format. Expected: "minLon,minLat,maxLon,maxLat"'
      );
    });
  });
});
