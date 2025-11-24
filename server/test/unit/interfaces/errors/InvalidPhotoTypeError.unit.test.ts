import { InvalidPhotoTypeError } from "../../../../src/interfaces/errors/InvalidPhotoTypeError";

describe("InvalidPhotoTypeError", () => {
  describe("constructor", () => {
    it("should create error with default message", () => {
      const error = new InvalidPhotoTypeError();

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Invalid photo type");
      expect(error.name).toBe("InvalidPhotoTypeError");
    });

    it("should create error with custom message", () => {
      const customMessage = "Only JPEG and PNG files are allowed";
      const error = new InvalidPhotoTypeError(customMessage);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(customMessage);
      expect(error.name).toBe("InvalidPhotoTypeError");
    });

    it("should maintain error inheritance", () => {
      const error = new InvalidPhotoTypeError();

      expect(error instanceof Error).toBe(true);
      expect(error instanceof InvalidPhotoTypeError).toBe(true);
    });

    it("should have correct stack trace", () => {
      const error = new InvalidPhotoTypeError("Test error");

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("InvalidPhotoTypeError");
    });
  });

  describe("Story 5 (PT05) - Photo validation scenarios", () => {
    it("should handle unsupported file format errors", () => {
      const error = new InvalidPhotoTypeError("File format .gif is not supported. Only JPEG and PNG are allowed.");

      expect(error.message).toContain("gif");
      expect(error.message).toContain("JPEG");
      expect(error.message).toContain("PNG");
    });

    it("should handle file size exceeded errors", () => {
      const error = new InvalidPhotoTypeError("File size exceeds 5MB limit");

      expect(error.message).toContain("5MB");
      expect(error.name).toBe("InvalidPhotoTypeError");
    });

    it("should handle corrupted file errors", () => {
      const error = new InvalidPhotoTypeError("File appears to be corrupted or invalid");

      expect(error.message).toContain("corrupted");
      expect(error.name).toBe("InvalidPhotoTypeError");
    });

    it("should handle too many photos error", () => {
      const error = new InvalidPhotoTypeError("Maximum 3 photos allowed per report");

      expect(error.message).toContain("3 photos");
      expect(error.name).toBe("InvalidPhotoTypeError");
    });

    it("should handle minimum photos requirement", () => {
      const error = new InvalidPhotoTypeError("At least 1 photo is required");

      expect(error.message).toContain("1 photo");
      expect(error.name).toBe("InvalidPhotoTypeError");
    });
  });

  describe("Error handling integration", () => {
    it("should be throwable and catchable", () => {
      expect(() => {
        throw new InvalidPhotoTypeError("Test throw");
      }).toThrow(InvalidPhotoTypeError);

      expect(() => {
        throw new InvalidPhotoTypeError("Test throw");
      }).toThrow("Test throw");
    });

    it("should work with try-catch blocks", () => {
      let caughtError: InvalidPhotoTypeError | null = null;

      try {
        throw new InvalidPhotoTypeError("Caught error test");
      } catch (error) {
        caughtError = error as InvalidPhotoTypeError;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toBe("Caught error test");
      expect(caughtError?.name).toBe("InvalidPhotoTypeError");
    });

    it("should be distinguishable from other errors", () => {
      const photoError = new InvalidPhotoTypeError("Photo error");
      const genericError = new Error("Generic error");

      expect(photoError instanceof InvalidPhotoTypeError).toBe(true);
      expect(photoError instanceof Error).toBe(true);
      expect(genericError instanceof InvalidPhotoTypeError).toBe(false);
      expect(genericError instanceof Error).toBe(true);
    });

    it("should serialize properly for logging", () => {
      const error = new InvalidPhotoTypeError("Serialization test");

      const serialized = JSON.stringify(error, Object.getOwnPropertyNames(error));
      const parsed = JSON.parse(serialized);

      expect(parsed.message).toBe("Serialization test");
      expect(parsed.name).toBe("InvalidPhotoTypeError");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty string message", () => {
      const error = new InvalidPhotoTypeError("");

      expect(error.message).toBe("");
      expect(error.name).toBe("InvalidPhotoTypeError");
    });

    it("should handle undefined message (uses default)", () => {
      const error = new InvalidPhotoTypeError(undefined);

      expect(error.message).toBe("Invalid photo type");
      expect(error.name).toBe("InvalidPhotoTypeError");
    });

    it("should handle very long error messages", () => {
      const longMessage = "A".repeat(1000);
      const error = new InvalidPhotoTypeError(longMessage);

      expect(error.message).toBe(longMessage);
      expect(error.message.length).toBe(1000);
      expect(error.name).toBe("InvalidPhotoTypeError");
    });

    it("should handle special characters in message", () => {
      const specialMessage = "Error with émojis 🚫📷 and ñümbers 123!@#$%^&*()";
      const error = new InvalidPhotoTypeError(specialMessage);

      expect(error.message).toBe(specialMessage);
      expect(error.name).toBe("InvalidPhotoTypeError");
    });
  });
});