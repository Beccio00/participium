import { LoginValidator } from "../../../src/validators/LoginValidator";

describe("LoginValidator", () => {
  describe("validate", () => {
    it("should return valid for correct form data", () => {
      const formData = {
        email: "john.doe@example.com",
        password: "password123",
      };

      const result = LoginValidator.validate(formData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("should return error for empty email", () => {
      const formData = {
        email: "",
        password: "password123",
      };

      const result = LoginValidator.validate(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe("Email is required");
    });

    it("should return error for invalid email", () => {
      const formData = {
        email: "invalid-email",
        password: "password123",
      };

      const result = LoginValidator.validate(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe("Please enter a valid email address");
    });

    it("should return error for empty password", () => {
      const formData = {
        email: "john.doe@example.com",
        password: "",
      };

      const result = LoginValidator.validate(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors.password).toBe("Password is required");
    });

    it("should return errors for multiple invalid fields", () => {
      const formData = {
        email: "",
        password: "",
      };

      const result = LoginValidator.validate(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe("Email is required");
      expect(result.errors.password).toBe("Password is required");
    });
  });

  describe("isValidEmail", () => {
    it("should return true for valid email", () => {
      expect(LoginValidator.isValidEmail("test@example.com")).toBe(true);
      expect(LoginValidator.isValidEmail("user.name+tag@example.co.uk")).toBe(
        true
      );
    });

    it("should return false for invalid email", () => {
      expect(LoginValidator.isValidEmail("invalid")).toBe(false);
      expect(LoginValidator.isValidEmail("test@")).toBe(false);
      expect(LoginValidator.isValidEmail("@example.com")).toBe(false);
      expect(LoginValidator.isValidEmail("test.example.com")).toBe(false);
    });
  });
});
