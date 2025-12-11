import { Request, Response } from "express";
import {
  createInternalNote,
  getInternalNote,
} from "../../../src/controllers/reportController";
import * as internalNoteService from "../../../src/services/internalNoteService";
import { Role } from "../../../../shared/RoleTypes";

jest.mock("../../../src/services/internalNoteService");

const mockCreateInternalNote =
  internalNoteService.createInternalNote as jest.MockedFunction<
    typeof internalNoteService.createInternalNote
  >;
const mockGetInternalNotes =
  internalNoteService.getInternalNotes as jest.MockedFunction<
    typeof internalNoteService.getInternalNotes
  >;

describe("Internal Note Controller - PT26", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    mockRes = {
      json: mockJson,
      status: mockStatus,
    };
  });

  describe("createInternalNote", () => {
    it("should create internal note successfully for technical user", async () => {
      mockReq = {
        params: { reportId: "1" },
        body: { content: "Technical note content" },
        user: { id: 10, role: Role.INFRASTRUCTURES } as any,
      };

      const mockNote = {
        id: 1,
        content: "Technical note content",
        reportId: 1,
        authorId: 10,
        authorRole: Role.INFRASTRUCTURES,
        createdAt: new Date("2024-01-01"),
        author: {
          id: 10,
          first_name: "Tech",
          last_name: "User",
          role: Role.INFRASTRUCTURES,
        },
      };

      mockCreateInternalNote.mockResolvedValue(mockNote as any);

      await createInternalNote(mockReq as Request, mockRes as Response);

      expect(mockCreateInternalNote).toHaveBeenCalledWith(
        1,
        "Technical note content",
        10,
        Role.INFRASTRUCTURES
      );
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockNote);
    });

    it("should create internal note for external maintainer", async () => {
      mockReq = {
        params: { reportId: "5" },
        body: { content: "External maintainer note" },
        user: { id: 20, role: Role.EXTERNAL_MAINTAINER } as any,
      };

      const mockNote = {
        id: 2,
        content: "External maintainer note",
        reportId: 5,
        authorId: 20,
        authorRole: Role.EXTERNAL_MAINTAINER,
        createdAt: new Date("2024-01-02"),
        author: {
          id: 20,
          first_name: "External",
          last_name: "User",
          role: Role.EXTERNAL_MAINTAINER,
        },
      };

      mockCreateInternalNote.mockResolvedValue(mockNote as any);

      await createInternalNote(mockReq as Request, mockRes as Response);

      expect(mockCreateInternalNote).toHaveBeenCalledWith(
        5,
        "External maintainer note",
        20,
        Role.EXTERNAL_MAINTAINER
      );
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockNote);
    });

    it("should handle service errors during note creation", async () => {
      mockReq = {
        params: { reportId: "999" },
        body: { content: "Note for non-existent report" },
        user: { id: 10, role: Role.INFRASTRUCTURES } as any,
      };

      const error = new Error("Report not found");
      mockCreateInternalNote.mockRejectedValue(error);

      await expect(
        createInternalNote(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Report not found");

      expect(mockCreateInternalNote).toHaveBeenCalledWith(
        999,
        "Note for non-existent report",
        10,
        Role.INFRASTRUCTURES
      );
      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });

    it("should parse reportId as integer", async () => {
      mockReq = {
        params: { reportId: "42" },
        body: { content: "Test note" },
        user: { id: 10, role: Role.WASTE_MANAGEMENT } as any,
      };

      const mockNote = {
        id: 3,
        content: "Test note",
        reportId: 42,
        authorId: 10,
        authorRole: Role.WASTE_MANAGEMENT,
        createdAt: new Date(),
        author: {
          id: 10,
          first_name: "Waste",
          last_name: "Manager",
          role: Role.WASTE_MANAGEMENT,
        },
      };

      mockCreateInternalNote.mockResolvedValue(mockNote as any);

      await createInternalNote(mockReq as Request, mockRes as Response);

      expect(mockCreateInternalNote).toHaveBeenCalledWith(
        42,
        "Test note",
        10,
        Role.WASTE_MANAGEMENT
      );
    });
  });

  describe("getInternalNote", () => {
    it("should retrieve all internal notes for a report", async () => {
      mockReq = {
        params: { reportId: "1" },
        user: { id: 10, role: Role.INFRASTRUCTURES } as any,
      };

      const mockNotes = [
        {
          id: 1,
          content: "First note",
          reportId: 1,
          authorId: 10,
          authorRole: Role.INFRASTRUCTURES,
          createdAt: new Date("2024-01-01"),
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
          createdAt: new Date("2024-01-02"),
          author: {
            id: 20,
            first_name: "External",
            last_name: "User",
            role: Role.EXTERNAL_MAINTAINER,
          },
        },
      ];

      mockGetInternalNotes.mockResolvedValue(mockNotes as any);

      await getInternalNote(mockReq as Request, mockRes as Response);

      expect(mockGetInternalNotes).toHaveBeenCalledWith(1, 10);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockNotes);
    });

    it("should return empty array when no internal notes exist", async () => {
      mockReq = {
        params: { reportId: "5" },
        user: { id: 10, role: Role.ROAD_MAINTENANCE } as any,
      };

      mockGetInternalNotes.mockResolvedValue([]);

      await getInternalNote(mockReq as Request, mockRes as Response);

      expect(mockGetInternalNotes).toHaveBeenCalledWith(5, 10);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith([]);
    });

    it("should handle service errors during retrieval", async () => {
      mockReq = {
        params: { reportId: "999" },
        user: { id: 10, role: Role.INFRASTRUCTURES } as any,
      };

      const error = new Error("Report not found");
      mockGetInternalNotes.mockRejectedValue(error);

      await expect(
        getInternalNote(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Report not found");

      expect(mockGetInternalNotes).toHaveBeenCalledWith(999, 10);
      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });

    it("should pass correct user id to service", async () => {
      mockReq = {
        params: { reportId: "10" },
        user: { id: 42, role: Role.CIVIL_PROTECTION } as any,
      };

      mockGetInternalNotes.mockResolvedValue([]);

      await getInternalNote(mockReq as Request, mockRes as Response);

      expect(mockGetInternalNotes).toHaveBeenCalledWith(10, 42);
    });

    it("should handle multiple notes in chronological order", async () => {
      mockReq = {
        params: { reportId: "3" },
        user: { id: 15, role: Role.GREENSPACES_AND_ANIMAL_PROTECTION } as any,
      };

      const mockNotes = [
        {
          id: 1,
          content: "First note",
          createdAt: new Date("2024-01-01T10:00:00"),
        },
        {
          id: 2,
          content: "Second note",
          createdAt: new Date("2024-01-01T11:00:00"),
        },
        {
          id: 3,
          content: "Third note",
          createdAt: new Date("2024-01-01T12:00:00"),
        },
      ];

      mockGetInternalNotes.mockResolvedValue(mockNotes as any);

      await getInternalNote(mockReq as Request, mockRes as Response);

      expect(mockGetInternalNotes).toHaveBeenCalledWith(3, 15);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockNotes);
      expect(mockNotes).toHaveLength(3);
    });
  });

  describe("Edge cases and validation", () => {
    it("should handle invalid reportId format", async () => {
      mockReq = {
        params: { reportId: "invalid" },
        body: { content: "Test note" },
        user: { id: 10, role: Role.INFRASTRUCTURES } as any,
      };

      await createInternalNote(mockReq as Request, mockRes as Response);

      // parseInt("invalid") returns NaN
      expect(mockCreateInternalNote).toHaveBeenCalledWith(
        NaN,
        "Test note",
        10,
        Role.INFRASTRUCTURES
      );
    });

    it("should handle empty content", async () => {
      mockReq = {
        params: { reportId: "1" },
        body: { content: "" },
        user: { id: 10, role: Role.INFRASTRUCTURES } as any,
      };

      const mockNote = {
        id: 1,
        content: "",
        reportId: 1,
        authorId: 10,
        authorRole: Role.INFRASTRUCTURES,
        createdAt: new Date(),
      };

      mockCreateInternalNote.mockResolvedValue(mockNote as any);

      await createInternalNote(mockReq as Request, mockRes as Response);

      expect(mockCreateInternalNote).toHaveBeenCalledWith(
        1,
        "",
        10,
        Role.INFRASTRUCTURES
      );
    });

    it("should handle very long note content", async () => {
      const longContent = "a".repeat(5000);
      mockReq = {
        params: { reportId: "1" },
        body: { content: longContent },
        user: { id: 10, role: Role.INFRASTRUCTURES } as any,
      };

      const mockNote = {
        id: 1,
        content: longContent,
        reportId: 1,
        authorId: 10,
        authorRole: Role.INFRASTRUCTURES,
        createdAt: new Date(),
      };

      mockCreateInternalNote.mockResolvedValue(mockNote as any);

      await createInternalNote(mockReq as Request, mockRes as Response);

      expect(mockCreateInternalNote).toHaveBeenCalledWith(
        1,
        longContent,
        10,
        Role.INFRASTRUCTURES
      );
    });
  });
});
