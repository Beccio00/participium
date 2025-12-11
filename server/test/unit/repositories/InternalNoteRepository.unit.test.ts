import { InternalNoteRepository } from "../../../src/repositories/InternalNoteRepository";
import { InternalNote } from "../../../src/entities/InternalNote";
import { AppDataSource } from "../../../src/utils/AppDataSource";
import { Repository } from "typeorm";
import { Role } from "../../../../shared/RoleTypes";

jest.mock("../../../src/utils/AppDataSource");

describe("InternalNoteRepository Unit Tests - PT26", () => {
  let internalNoteRepository: InternalNoteRepository;
  let mockRepository: Partial<Repository<InternalNote>>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
    internalNoteRepository = new InternalNoteRepository();
  });

  describe("create", () => {
    it("should create and return a new internal note with relations", async () => {
      const noteData = {
        content: "Technical note for infrastructure issue",
        reportId: 1,
        authorId: 10,
        authorRole: Role.INFRASTRUCTURES,
      };

      const mockCreatedNote = {
        id: 1,
        ...noteData,
        createdAt: new Date("2024-01-01"),
      };

      const mockNoteWithRelations = {
        ...mockCreatedNote,
        author: {
          id: 10,
          first_name: "Tech",
          last_name: "User",
          role: Role.INFRASTRUCTURES,
        },
      };

      (mockRepository.create as jest.Mock).mockReturnValue(mockCreatedNote);
      (mockRepository.save as jest.Mock).mockResolvedValue(mockCreatedNote);
      (mockRepository.findOne as jest.Mock).mockResolvedValue(
        mockNoteWithRelations
      );

      const result = await internalNoteRepository.create(noteData);

      expect(mockRepository.create).toHaveBeenCalledWith(noteData);
      expect(mockRepository.save).toHaveBeenCalledWith(mockCreatedNote);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ["author"],
      });
      expect(result).toEqual(mockNoteWithRelations);
      expect(result.author).toBeDefined();
      expect(result.author.id).toBe(10);
    });

    it("should create note for external maintainer", async () => {
      const noteData = {
        content: "External maintainer note",
        reportId: 5,
        authorId: 20,
        authorRole: Role.EXTERNAL_MAINTAINER,
      };

      const mockCreatedNote = {
        id: 2,
        ...noteData,
        createdAt: new Date(),
      };

      const mockNoteWithRelations = {
        ...mockCreatedNote,
        author: {
          id: 20,
          first_name: "External",
          last_name: "Maintainer",
          role: Role.EXTERNAL_MAINTAINER,
        },
      };

      (mockRepository.create as jest.Mock).mockReturnValue(mockCreatedNote);
      (mockRepository.save as jest.Mock).mockResolvedValue(mockCreatedNote);
      (mockRepository.findOne as jest.Mock).mockResolvedValue(
        mockNoteWithRelations
      );

      const result = await internalNoteRepository.create(noteData);

      expect(result.author.role).toBe(Role.EXTERNAL_MAINTAINER);
    });

    it("should handle empty content", async () => {
      const noteData = {
        content: "",
        reportId: 1,
        authorId: 10,
        authorRole: Role.INFRASTRUCTURES,
      };

      const mockCreatedNote = { id: 3, ...noteData, createdAt: new Date() };
      const mockNoteWithRelations = {
        ...mockCreatedNote,
        author: { id: 10, first_name: "Test", last_name: "User" },
      };

      (mockRepository.create as jest.Mock).mockReturnValue(mockCreatedNote);
      (mockRepository.save as jest.Mock).mockResolvedValue(mockCreatedNote);
      (mockRepository.findOne as jest.Mock).mockResolvedValue(
        mockNoteWithRelations
      );

      const result = await internalNoteRepository.create(noteData);

      expect(result.content).toBe("");
    });

    it("should handle very long content", async () => {
      const longContent = "a".repeat(5000);
      const noteData = {
        content: longContent,
        reportId: 1,
        authorId: 10,
        authorRole: Role.ROAD_MAINTENANCE,
      };

      const mockCreatedNote = { id: 4, ...noteData, createdAt: new Date() };
      const mockNoteWithRelations = {
        ...mockCreatedNote,
        author: { id: 10, first_name: "Test", last_name: "User" },
      };

      (mockRepository.create as jest.Mock).mockReturnValue(mockCreatedNote);
      (mockRepository.save as jest.Mock).mockResolvedValue(mockCreatedNote);
      (mockRepository.findOne as jest.Mock).mockResolvedValue(
        mockNoteWithRelations
      );

      const result = await internalNoteRepository.create(noteData);

      expect(result.content).toBe(longContent);
      expect(result.content.length).toBe(5000);
    });
  });

  describe("findByReportId", () => {
    it("should return all internal notes for a report in chronological order", async () => {
      const reportId = 1;
      const mockNotes = [
        {
          id: 1,
          content: "First note",
          reportId: 1,
          authorId: 10,
          authorRole: Role.INFRASTRUCTURES,
          createdAt: new Date("2024-01-01T10:00:00"),
          author: {
            id: 10,
            first_name: "Tech",
            last_name: "User",
            role: Role.INFRASTRUCTURES,
          },
        },
        {
          id: 2,
          content: "Second note",
          reportId: 1,
          authorId: 20,
          authorRole: Role.EXTERNAL_MAINTAINER,
          createdAt: new Date("2024-01-01T11:00:00"),
          author: {
            id: 20,
            first_name: "External",
            last_name: "User",
            role: Role.EXTERNAL_MAINTAINER,
          },
        },
      ];

      (mockRepository.find as jest.Mock).mockResolvedValue(mockNotes);

      const result = await internalNoteRepository.findByReportId(reportId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { reportId: 1 },
        relations: ["author"],
        order: { createdAt: "ASC" },
      });
      expect(result).toEqual(mockNotes);
      expect(result).toHaveLength(2);
      expect(result[0].createdAt < result[1].createdAt).toBe(true);
    });

    it("should return empty array when no notes exist for report", async () => {
      const reportId = 999;

      (mockRepository.find as jest.Mock).mockResolvedValue([]);

      const result = await internalNoteRepository.findByReportId(reportId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { reportId: 999 },
        relations: ["author"],
        order: { createdAt: "ASC" },
      });
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should include author relations", async () => {
      const reportId = 5;
      const mockNotes = [
        {
          id: 1,
          content: "Note with author",
          reportId: 5,
          authorId: 10,
          createdAt: new Date(),
          author: {
            id: 10,
            first_name: "Tech",
            last_name: "User",
            email: "tech@example.com",
            role: Role.WASTE_MANAGEMENT,
          },
        },
      ];

      (mockRepository.find as jest.Mock).mockResolvedValue(mockNotes);

      const result = await internalNoteRepository.findByReportId(reportId);

      expect(result[0].author).toBeDefined();
      expect(result[0].author.first_name).toBe("Tech");
      expect(result[0].author.role).toBe(Role.WASTE_MANAGEMENT);
    });

    it("should handle large number of notes", async () => {
      const reportId = 1;
      const mockNotes = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        content: `Note ${i + 1}`,
        reportId: 1,
        authorId: 10,
        createdAt: new Date(
          `2024-01-01T${String(10 + i).padStart(2, "0")}:00:00`
        ),
        author: { id: 10, first_name: "Tech", last_name: "User" },
      }));

      (mockRepository.find as jest.Mock).mockResolvedValue(mockNotes);

      const result = await internalNoteRepository.findByReportId(reportId);

      expect(result).toHaveLength(100);
    });
  });

  describe("findById", () => {
    it("should return internal note with author and report relations", async () => {
      const noteId = 1;
      const mockNote = {
        id: 1,
        content: "Test note",
        reportId: 5,
        authorId: 10,
        authorRole: Role.INFRASTRUCTURES,
        createdAt: new Date(),
        author: {
          id: 10,
          first_name: "Tech",
          last_name: "User",
          role: Role.INFRASTRUCTURES,
        },
        report: {
          id: 5,
          title: "Test Report",
          status: "ASSIGNED",
        },
      };

      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockNote);

      const result = await internalNoteRepository.findById(noteId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ["author", "report"],
      });
      expect(result).toEqual(mockNote);
      expect(result?.author).toBeDefined();
      expect(result?.report).toBeDefined();
    });

    it("should return null when note not found", async () => {
      const noteId = 999;

      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await internalNoteRepository.findById(noteId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ["author", "report"],
      });
      expect(result).toBeNull();
    });

    it("should load both author and report relations", async () => {
      const noteId = 10;
      const mockNote = {
        id: 10,
        content: "Note with full relations",
        reportId: 3,
        authorId: 15,
        createdAt: new Date(),
        author: {
          id: 15,
          first_name: "John",
          last_name: "Doe",
          role: Role.CIVIL_PROTECTION,
        },
        report: {
          id: 3,
          title: "Emergency Report",
          category: "CIVIL_PROTECTION",
          status: "IN_PROGRESS",
        },
      };

      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockNote);

      const result = await internalNoteRepository.findById(noteId);

      expect(result?.author.first_name).toBe("John");
      expect(result?.report.title).toBe("Emergency Report");
    });
  });

  describe("update", () => {
    it("should update note content and return updated note", async () => {
      const noteId = 1;
      const newContent = "Updated content";
      const existingNote = {
        id: 1,
        content: "Old content",
        reportId: 5,
        authorId: 10,
        createdAt: new Date(),
        author: { id: 10, first_name: "Tech", last_name: "User" },
        report: { id: 5, title: "Test Report" },
      };

      const updatedNote = { ...existingNote, content: newContent };

      (mockRepository.findOne as jest.Mock).mockResolvedValue(existingNote);
      (mockRepository.save as jest.Mock).mockResolvedValue(updatedNote);

      const result = await internalNoteRepository.update(noteId, newContent);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ["author", "report"],
      });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...existingNote,
        content: newContent,
      });
      expect(result?.content).toBe(newContent);
    });

    it("should return null when note not found", async () => {
      const noteId = 999;
      const newContent = "New content";

      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await internalNoteRepository.update(noteId, newContent);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ["author", "report"],
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("should handle empty content update", async () => {
      const noteId = 1;
      const newContent = "";
      const existingNote = {
        id: 1,
        content: "Old content",
        reportId: 5,
        authorId: 10,
        createdAt: new Date(),
      };

      const updatedNote = { ...existingNote, content: "" };

      (mockRepository.findOne as jest.Mock).mockResolvedValue(existingNote);
      (mockRepository.save as jest.Mock).mockResolvedValue(updatedNote);

      const result = await internalNoteRepository.update(noteId, newContent);

      expect(result?.content).toBe("");
    });
  });

  describe("delete", () => {
    it("should delete note and return true when successful", async () => {
      const noteId = 1;

      (mockRepository.delete as jest.Mock).mockResolvedValue({ affected: 1 });

      const result = await internalNoteRepository.delete(noteId);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it("should return false when note not found", async () => {
      const noteId = 999;

      (mockRepository.delete as jest.Mock).mockResolvedValue({ affected: 0 });

      const result = await internalNoteRepository.delete(noteId);

      expect(mockRepository.delete).toHaveBeenCalledWith(999);
      expect(result).toBe(false);
    });

    it("should handle undefined affected value", async () => {
      const noteId = 1;

      (mockRepository.delete as jest.Mock).mockResolvedValue({
        affected: undefined,
      });

      const result = await internalNoteRepository.delete(noteId);

      expect(result).toBe(false);
    });

    it("should handle null affected value", async () => {
      const noteId = 1;

      (mockRepository.delete as jest.Mock).mockResolvedValue({
        affected: null,
      });

      const result = await internalNoteRepository.delete(noteId);

      expect(result).toBe(false);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle database errors during create", async () => {
      const noteData = {
        content: "Test",
        reportId: 1,
        authorId: 10,
        authorRole: Role.INFRASTRUCTURES,
      };

      (mockRepository.create as jest.Mock).mockReturnValue(noteData);
      (mockRepository.save as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(internalNoteRepository.create(noteData)).rejects.toThrow(
        "Database error"
      );
    });

    it("should handle database errors during findByReportId", async () => {
      (mockRepository.find as jest.Mock).mockRejectedValue(
        new Error("Connection lost")
      );

      await expect(internalNoteRepository.findByReportId(1)).rejects.toThrow(
        "Connection lost"
      );
    });

    it("should handle special characters in content", async () => {
      const specialContent = "Test<>\"'&\n\t\r";
      const noteData = {
        content: specialContent,
        reportId: 1,
        authorId: 10,
        authorRole: Role.INFRASTRUCTURES,
      };

      const mockCreatedNote = { id: 1, ...noteData, createdAt: new Date() };
      const mockNoteWithRelations = {
        ...mockCreatedNote,
        author: { id: 10, first_name: "Test", last_name: "User" },
      };

      (mockRepository.create as jest.Mock).mockReturnValue(mockCreatedNote);
      (mockRepository.save as jest.Mock).mockResolvedValue(mockCreatedNote);
      (mockRepository.findOne as jest.Mock).mockResolvedValue(
        mockNoteWithRelations
      );

      const result = await internalNoteRepository.create(noteData);

      expect(result.content).toBe(specialContent);
    });
  });
});
