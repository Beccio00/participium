// Mock repository
const mockInternalNoteRepo = {
  create: jest.fn(),
  findByReportId: jest.fn(),
};
const mockReportRepo = {
  findByIdWithRelations: jest.fn(),
};
const mockUserRepo = {
  findById: jest.fn(),
};

jest.mock("../../../src/repositories/InternalNoteRepository", () => ({
  InternalNoteRepository: jest
    .fn()
    .mockImplementation(() => mockInternalNoteRepo),
}));
jest.mock("../../../src/repositories/ReportRepository", () => ({
  ReportRepository: jest.fn().mockImplementation(() => mockReportRepo),
}));
jest.mock("../../../src/repositories/UserRepository", () => ({
  UserRepository: jest.fn().mockImplementation(() => mockUserRepo),
}));

import {
  createInternalNote,
  getInternalNotes,
} from "../../../src/services/internalNoteService";
import { Role } from "../../../../shared/RoleTypes";
import {
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from "../../../src/utils/errors";

describe("internalNoteService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createInternalNote", () => {
    it("should add an internal note for technical staff", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue({ id: 1 });
      mockUserRepo.findById.mockResolvedValue({
        id: 2,
        first_name: "Mario",
        last_name: "Rossi",
        role: "INFRASTRUCTURES",
      });
      mockInternalNoteRepo.create.mockResolvedValue({
        id: 10,
        content: "Test note",
        authorId: 2,
        author: {
          first_name: "Mario",
          last_name: "Rossi",
          role: "INFRASTRUCTURES",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await createInternalNote(
        1,
        "Test note",
        2,
        Role.INFRASTRUCTURES
      );
      expect(result).toMatchObject({
        id: 10,
        content: "Test note",
        authorId: 2,
      });
    });

    it("should throw NotFoundError if report does not exist", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue(null);
      await expect(
        createInternalNote(1, "Test note", 2, Role.INFRASTRUCTURES)
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw BadRequestError if note content is empty", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue({ id: 1 });
      await expect(
        createInternalNote(1, "", 2, Role.INFRASTRUCTURES)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("getInternalNotes", () => {
    it("should return internal notes for a report (N > 1)", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue({
        id: 1,
        assignedOfficerId: 2,
      });
      mockInternalNoteRepo.findByReportId.mockResolvedValue([
        {
          id: 101,
          content: "Note 1",
          authorId: 25,
          author: {
            first_name: "Marco",
            last_name: "Bianchi",
            role: "INFRASTRUCTURES",
          },
          createdAt: new Date("2025-12-03T09:15:00Z"),
          updatedAt: new Date("2025-12-03T09:15:00Z"),
        },
        {
          id: 102,
          content: "Note 2",
          authorId: 25,
          author: {
            first_name: "Marco",
            last_name: "Bianchi",
            role: "INFRASTRUCTURES",
          },
          createdAt: new Date("2025-12-03T14:30:00Z"),
          updatedAt: new Date("2025-12-03T14:30:00Z"),
        },
      ]);
      const notes = await getInternalNotes(1, 2);
      expect(notes).toHaveLength(2);
      expect(notes[0].content).toBe("Note 1");
      expect(notes[1].content).toBe("Note 2");
    });

    it("should return a single internal note for a report (N = 1)", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue({
        id: 1,
        assignedOfficerId: 2,
      });
      mockInternalNoteRepo.findByReportId.mockResolvedValue([
        {
          id: 201,
          content: "Only note",
          authorId: 30,
          author: {
            first_name: "Anna",
            last_name: "Verdi",
            role: "INFRASTRUCTURES",
          },
          createdAt: new Date("2025-12-04T10:00:00Z"),
          updatedAt: new Date("2025-12-04T10:00:00Z"),
        },
      ]);
      const notes = await getInternalNotes(1, 2);
      expect(notes).toHaveLength(1);
      expect(notes[0].content).toBe("Only note");
    });

    it("should return an empty array if there are no internal notes (N = 0)", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue({
        id: 1,
        assignedOfficerId: 2,
      });
      mockInternalNoteRepo.findByReportId.mockResolvedValue([]);
      const notes = await getInternalNotes(1, 2);
      expect(notes).toEqual([]);
    });

    it("should throw NotFoundError if report does not exist", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue(null);
      await expect(getInternalNotes(1, 2)).rejects.toThrow(NotFoundError);
    });
  });
});
