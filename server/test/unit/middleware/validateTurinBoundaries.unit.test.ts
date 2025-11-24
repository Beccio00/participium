import { Request, Response, NextFunction } from "express";
import { validateTurinBoundaries } from "../../../src/middlewares/validateTurinBoundaries";
import { UnprocessableEntityError } from "../../../src/utils";

describe("validateTurinBoundaries middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {}
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  describe("Story 5 (PT05) - Turin boundaries validation", () => {
    it("should pass when coordinates are inside Turin boundaries", () => {
      // Coordinate nel centro di Torino
      mockReq.body = {
        latitude: "45.0703",
        longitude: "7.6869"
      };

      validateTurinBoundaries(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should pass when coordinates are near Turin city center", () => {
      // Piazza Castello, Torino
      mockReq.body = {
        latitude: "45.0722",
        longitude: "7.6859"
      };

      validateTurinBoundaries(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should throw error when coordinates are outside Turin boundaries", () => {
      // Milano coordinates (outside Turin)
      mockReq.body = {
        latitude: "45.4642",
        longitude: "9.1900"
      };

      expect(() => {
        validateTurinBoundaries(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(UnprocessableEntityError);

      expect(() => {
        validateTurinBoundaries(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow("Coordinates are outside Turin municipality boundaries");

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should throw error when coordinates are far outside Turin", () => {
      // Roma coordinates (very far from Turin)
      mockReq.body = {
        latitude: "41.9028",
        longitude: "12.4964"
      };

      expect(() => {
        validateTurinBoundaries(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(UnprocessableEntityError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should pass when latitude is missing", () => {
      mockReq.body = {
        longitude: "7.6869"
      };

      validateTurinBoundaries(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should pass when longitude is missing", () => {
      mockReq.body = {
        latitude: "45.0703"
      };

      validateTurinBoundaries(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should pass when both coordinates are missing", () => {
      mockReq.body = {
        title: "Test report"
      };

      validateTurinBoundaries(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should pass when latitude is undefined", () => {
      mockReq.body = {
        latitude: undefined,
        longitude: "7.6869"
      };

      validateTurinBoundaries(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should pass when longitude is undefined", () => {
      mockReq.body = {
        latitude: "45.0703",
        longitude: undefined
      };

      validateTurinBoundaries(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should pass when latitude is NaN", () => {
      mockReq.body = {
        latitude: "not-a-number",
        longitude: "7.6869"
      };

      validateTurinBoundaries(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should pass when longitude is NaN", () => {
      mockReq.body = {
        latitude: "45.0703",
        longitude: "not-a-number"
      };

      validateTurinBoundaries(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should handle string coordinates correctly", () => {
      // Mole Antonelliana, Torino
      mockReq.body = {
        latitude: "45.0691",
        longitude: "7.6934"
      };

      validateTurinBoundaries(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should handle numeric coordinates correctly", () => {
      // Palazzo Reale, Torino
      mockReq.body = {
        latitude: 45.0726,
        longitude: 7.6855
      };

      validateTurinBoundaries(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should validate coordinates at Turin polygon edge", () => {
      // Coordinate molto vicine al confine di Torino
      mockReq.body = {
        latitude: "45.1240",
        longitude: "7.5810"
      };

      validateTurinBoundaries(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should reject coordinates just outside Turin boundaries", () => {
      // Coordinate appena fuori dai confini
      mockReq.body = {
        latitude: "45.2000", // Troppo a nord
        longitude: "7.6869"
      };

      expect(() => {
        validateTurinBoundaries(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(UnprocessableEntityError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle zero coordinates", () => {
      mockReq.body = {
        latitude: "0",
        longitude: "0"
      };

      expect(() => {
        validateTurinBoundaries(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(UnprocessableEntityError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle negative coordinates outside Turin", () => {
      mockReq.body = {
        latitude: "-45.0703", // Coordinate nell'emisfero sud
        longitude: "7.6869"
      };

      expect(() => {
        validateTurinBoundaries(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(UnprocessableEntityError);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle empty body", () => {
      mockReq.body = {};

      validateTurinBoundaries(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should handle null coordinates", () => {
      mockReq.body = {
        latitude: null,
        longitude: null
      };

      validateTurinBoundaries(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should handle extreme values", () => {
      mockReq.body = {
        latitude: "999",
        longitude: "999"
      };

      expect(() => {
        validateTurinBoundaries(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(UnprocessableEntityError);
    });

    it("should handle very precise coordinates in Turin", () => {
      // Coordinate molto precise nel centro di Torino
      mockReq.body = {
        latitude: "45.070312456789",
        longitude: "7.686901234567"
      };

      validateTurinBoundaries(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});