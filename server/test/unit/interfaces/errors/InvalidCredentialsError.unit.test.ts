import { InvalidCredentialsError } from "../../../../src/interfaces/errors/InvalidCredentialsError";

describe("InvalidCredentialsError", () => {
  describe("constructor", () => {
    it("should create error with default message", () => {
      const error = new InvalidCredentialsError();

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Invalid username or password");
    });

    it("should create error with custom message", () => {
      const customMessage = "Account locked due to too many failed attempts";
      const error = new InvalidCredentialsError(customMessage);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(customMessage);
    });

    it("should maintain error inheritance", () => {
      const error = new InvalidCredentialsError();

      expect(error instanceof Error).toBe(true);
      expect(error instanceof InvalidCredentialsError).toBe(true);
    });

    it("should have correct stack trace", () => {
      const error = new InvalidCredentialsError("Test credentials error");

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("InvalidCredentialsError");
    });
  });

  describe("Authentication scenarios", () => {
    it("should handle wrong password error", () => {
      const error = new InvalidCredentialsError("Password is incorrect");

      expect(error.message).toBe("Password is incorrect");
    });

    it("should handle user not found error", () => {
      const error = new InvalidCredentialsError("User not found");

      expect(error.message).toBe("User not found");
    });

    it("should handle account disabled error", () => {
      const error = new InvalidCredentialsError("Account has been disabled");

      expect(error.message).toBe("Account has been disabled");
    });

    it("should handle expired credentials error", () => {
      const error = new InvalidCredentialsError("Credentials have expired");

      expect(error.message).toBe("Credentials have expired");
    });

    it("should handle invalid email format error", () => {
      const error = new InvalidCredentialsError("Invalid email format");

      expect(error.message).toBe("Invalid email format");
    });

    it("should handle empty credentials error", () => {
      const error = new InvalidCredentialsError("Email and password are required");

      expect(error.message).toBe("Email and password are required");
    });
  });

  describe("Error handling integration", () => {
    it("should be throwable and catchable", () => {
      expect(() => {
        throw new InvalidCredentialsError("Test throw");
      }).toThrow(InvalidCredentialsError);

      expect(() => {
        throw new InvalidCredentialsError("Test throw");
      }).toThrow("Test throw");
    });

    it("should work with try-catch blocks", () => {
      let caughtError: InvalidCredentialsError | null = null;

      try {
        throw new InvalidCredentialsError("Caught credentials error");
      } catch (error) {
        caughtError = error as InvalidCredentialsError;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toBe("Caught credentials error");
    });

    it("should be distinguishable from other errors", () => {
      const credentialsError = new InvalidCredentialsError("Credentials error");
      const genericError = new Error("Generic error");

      expect(credentialsError instanceof InvalidCredentialsError).toBe(true);
      expect(credentialsError instanceof Error).toBe(true);
      expect(genericError instanceof InvalidCredentialsError).toBe(false);
      expect(genericError instanceof Error).toBe(true);
    });

    it("should serialize properly for logging", () => {
      const error = new InvalidCredentialsError("Serialization test");

      const serialized = JSON.stringify(error, Object.getOwnPropertyNames(error));
      const parsed = JSON.parse(serialized);

      expect(parsed.message).toBe("Serialization test");
    });
  });

  describe("Security considerations", () => {
    it("should not leak sensitive information in default message", () => {
      const error = new InvalidCredentialsError();

      expect(error.message).not.toContain("admin");
      expect(error.message).not.toContain("email");
      expect(error.message).not.toContain("specific");
      expect(error.message).toBe("Invalid username or password"); // Test che il messaggio sia generico
    });

    it("should handle rate limiting scenarios", () => {
      const error = new InvalidCredentialsError("Too many login attempts. Please try again later.");

      expect(error.message).toContain("Too many");
      expect(error.message).toContain("try again later");
    });

    it("should handle session expired scenarios", () => {
      const error = new InvalidCredentialsError("Session has expired. Please login again.");

      expect(error.message).toContain("Session");
      expect(error.message).toContain("expired");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty string message", () => {
      const error = new InvalidCredentialsError("");

      expect(error.message).toBe("");
    });

    it("should handle undefined message (uses default)", () => {
      const error = new InvalidCredentialsError(undefined);

      expect(error.message).toBe("Invalid username or password");
    });

    it("should handle very long error messages", () => {
      const longMessage = "Invalid credentials: " + "A".repeat(1000);
      const error = new InvalidCredentialsError(longMessage);

      expect(error.message).toBe(longMessage);
      expect(error.message.length).toBeGreaterThan(1000);
    });

    it("should handle special characters in message", () => {
      const specialMessage = "Invalid credentials: émojis 🔐❌ and ñümbers 123!@#$%";
      const error = new InvalidCredentialsError(specialMessage);

      expect(error.message).toBe(specialMessage);
    });

    it("should handle null message parameter", () => {
      const error = new InvalidCredentialsError(null as any);

      expect(error.message).toBe("null"); // Il costruttore Error base converte null a stringa
    });
  });

  describe("Story 5 authentication integration", () => {
    it("should be ready for report creation authentication", () => {
      const error = new InvalidCredentialsError("Authentication required for report creation");

      expect(error.message).toContain("Authentication required");
      expect(error.message).toContain("report creation");
    });

    it("should handle citizen authentication errors", () => {
      const error = new InvalidCredentialsError("Citizen authentication failed");

      expect(error.message).toContain("Citizen");
      expect(error.message).toContain("authentication failed");
    });

    it("should handle municipality user authentication", () => {
      const error = new InvalidCredentialsError("Municipality user credentials are invalid");

      expect(error.message).toContain("Municipality user");
      expect(error.message).toContain("invalid");
    });
  });
});