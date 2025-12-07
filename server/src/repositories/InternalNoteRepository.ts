import { Repository } from "typeorm";
import { AppDataSource } from "../utils/AppDataSource";
import { InternalNote } from "../entities/InternalNote";

export class InternalNoteRepository {
  private repository: Repository<InternalNote>;

  constructor() {
    this.repository = AppDataSource.getRepository(InternalNote);
  }

  /**
   * Create a new internal note
   */
  async create(noteData: {
    content: string;
    reportId: number;
    authorId: number;
  }): Promise<InternalNote> {
    const note = this.repository.create(noteData);
    return await this.repository.save(note);
  }

  /**
   * Find all internal notes for a specific report
   * Includes author information for display
   */
  async findByReportId(reportId: number): Promise<InternalNote[]> {
    return await this.repository.find({
      where: { reportId },
      relations: ["author"],
      order: { createdAt: "ASC" }
    });
  }

  /**
   * Find a single internal note by ID
   */
  async findById(id: number): Promise<InternalNote | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["author", "report"]
    });
  }

  /**
   * Update an internal note
   */
  async update(id: number, content: string): Promise<InternalNote | null> {
    const note = await this.findById(id);
    if (!note) {
      return null;
    }
    note.content = content;
    return await this.repository.save(note);
  }

  /**
   * Delete an internal note
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
