import { upload } from "../../../src/middlewares/uploadsMiddleware";

describe("uploadsMiddleware", () => {
  describe("Story 5 (PT05) - Photo upload configuration", () => {
    it("should export upload middleware", () => {
      expect(upload).toBeDefined();
      expect(typeof upload).toBe("object");
    });

    it("should be a multer instance with proper configuration", () => {
      // Test che il middleware sia configurato correttamente
      expect(upload).toHaveProperty("single");
      expect(upload).toHaveProperty("array");
      expect(upload).toHaveProperty("fields");
      expect(upload).toHaveProperty("none");
      expect(upload).toHaveProperty("any");
    });

    it("should have correct methods for file upload handling", () => {
      expect(typeof upload.single).toBe("function");
      expect(typeof upload.array).toBe("function");
      expect(typeof upload.fields).toBe("function");
      expect(typeof upload.none).toBe("function");
      expect(typeof upload.any).toBe("function");
    });
  });

  describe("Middleware availability", () => {
    it("should provide single file upload method", () => {
      const singleUpload = upload.single("photo");
      expect(singleUpload).toBeDefined();
      expect(typeof singleUpload).toBe("function");
    });

    it("should provide array upload method for multiple photos", () => {
      const arrayUpload = upload.array("photos", 3);
      expect(arrayUpload).toBeDefined();
      expect(typeof arrayUpload).toBe("function");
    });

    it("should provide fields upload method", () => {
      const fieldsUpload = upload.fields([{ name: "photos", maxCount: 3 }]);
      expect(fieldsUpload).toBeDefined();
      expect(typeof fieldsUpload).toBe("function");
    });
  });

  describe("Story 5 requirements validation", () => {
    it("should support multiple file upload for PT05 photo requirements", () => {
      // PT05 richiede 1-3 foto per report
      const multiplePhotosUpload = upload.array("photos", 3);
      expect(multiplePhotosUpload).toBeDefined();
      expect(typeof multiplePhotosUpload).toBe("function");
    });

    it("should be ready for integration with photo validation", () => {
      // Il middleware deve essere pronto per validare formati e dimensioni
      expect(upload).toBeDefined();
      
      // Verifica che abbia i metodi necessari
      expect(upload.array).toBeDefined();
      expect(upload.single).toBeDefined();
    });
  });
});