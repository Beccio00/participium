import { SignupValidator } from "../../../src/validators/SignupValidator";

describe("SignupValidator", () => {
  describe("validate", () => {
    it("should return valid for correct form data", () => {
      const formData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "password123",
      };

      const result = SignupValidator.validate(formData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("should return error for empty first name", () => {
      const formData = {
        firstName: "",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "password123",
      };

      const result = SignupValidator.validate(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors.firstName).toBe("First name is required");
    });

    it("should return error for short first name", () => {
      const formData = {
        firstName: "J",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "password123",
      };

      const result = SignupValidator.validate(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors.firstName).toBe(
        "First name must be at least 2 characters"
      );
    });

    it("should return error for empty last name", () => {
      const formData = {
        firstName: "John",
        lastName: "",
        email: "john.doe@example.com",
        password: "password123",
      };

      const result = SignupValidator.validate(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors.lastName).toBe("Last name is required");
    });

    it("should return error for short last name", () => {
      const formData = {
        firstName: "John",
        lastName: "D",
        email: "john.doe@example.com",
        password: "password123",
      };

      const result = SignupValidator.validate(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors.lastName).toBe(
        "Last name must be at least 2 characters"
      );
    });

    it("should return error for empty email", () => {
      const formData = {
        firstName: "John",
        lastName: "Doe",
        email: "",
        password: "password123",
      };

      const result = SignupValidator.validate(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe("Email is required");
    });

    it("should return error for invalid email", () => {
      const formData = {
        firstName: "John",
        lastName: "Doe",
        email: "invalid-email",
        password: "password123",
      };

      const result = SignupValidator.validate(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe("Please enter a valid email address");
    });

    it("should return error for empty password", () => {
      const formData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "",
      };

      const result = SignupValidator.validate(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors.password).toBe("Password is required");
    });

    it("should return error for short password", () => {
      const formData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "1234567",
      };

      const result = SignupValidator.validate(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors.password).toBe(
        "Password must be at least 8 characters long"
      );
    });

    it("should return errors for multiple invalid fields", () => {
      const formData = {
        firstName: "",
        lastName: "",
        email: "invalid",
        password: "short",
      };

      const result = SignupValidator.validate(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors.firstName).toBe("First name is required");
      expect(result.errors.lastName).toBe("Last name is required");
      expect(result.errors.email).toBe("Please enter a valid email address");
      expect(result.errors.password).toBe(
        "Password must be at least 8 characters long"
      );
    });
  });

  describe("isValidEmail", () => {
    it("should return true for valid email", () => {
      expect(SignupValidator.isValidEmail("test@example.com")).toBe(true);
      expect(SignupValidator.isValidEmail("user.name+tag@example.co.uk")).toBe(
        true
      );
    });

    it("should return false for invalid email", () => {
      expect(SignupValidator.isValidEmail("invalid")).toBe(false);
      expect(SignupValidator.isValidEmail("test@")).toBe(false);
      expect(SignupValidator.isValidEmail("@example.com")).toBe(false);
      expect(SignupValidator.isValidEmail("test.example.com")).toBe(false);
    });
  });
});
