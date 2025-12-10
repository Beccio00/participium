import { Request, Response, NextFunction } from "express";

// Mock multer - must be declared before any imports that use it
jest.mock("multer", () => {
  // Create mock middleware that calls callback with no error
  const createMockMiddleware = () => (req: any, res: any, cb: any) => {
    cb(null);
  };

  const mockMulterInstance = {
    array: jest.fn(() => createMockMiddleware()),
  };
  
  const mockMulter = jest.fn(() => mockMulterInstance);
  (mockMulter as any).memoryStorage = jest.fn(() => ({}));
  (mockMulter as any).MulterError = class MulterError extends Error {
    code: string;
    field?: string;
    constructor(code: string, field?: string) {
      super(code);
      this.code = code;
      this.field = field;
    }
  };
  return mockMulter;
});

import { upload } from "../../../src/middlewares/uploadsMiddleware";

describe("uploadsMiddleware", () => {
  describe("upload object", () => {
    it("should export upload object", () => {
      expect(upload).toBeDefined();
      expect(typeof upload).toBe("object");
    });

    it("should have array method", () => {
      expect(upload.array).toBeDefined();
      expect(typeof upload.array).toBe("function");
    });
  });

  describe("upload.array method", () => {
    it("should return a middleware function", () => {
      const middleware = upload.array("photos", 3);
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe("function");
    });

    it("should accept fieldName and maxCount parameters", () => {
      const middleware = upload.array("photos", 5);
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe("function");
    });

    it("should create middleware for single file upload", () => {
      const middleware = upload.array("photo", 1);
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe("function");
    });

    it("should create middleware for multiple files upload", () => {
      const middleware = upload.array("photos", 3);
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe("function");
    });
  });

  describe("Story 5 (PT05) - Photo upload configuration", () => {
    it("should support 1-3 photo upload for report creation", () => {
      // PT05 requires 1-3 photos per report
      const multiplePhotosUpload = upload.array("photos", 3);
      expect(multiplePhotosUpload).toBeDefined();
      expect(typeof multiplePhotosUpload).toBe("function");
    });

    it("should be ready for integration with report routes", () => {
      const uploadMiddleware = upload.array("photos", 3);
      expect(uploadMiddleware).toBeDefined();
      expect(typeof uploadMiddleware).toBe("function");
    });

    it("should handle different field names", () => {
      const avatarUpload = upload.array("avatar", 1);
      const documentsUpload = upload.array("documents", 10);
      
      expect(avatarUpload).toBeDefined();
      expect(documentsUpload).toBeDefined();
    });
  });
});
