import { Repository } from "typeorm";
import { AppDataSource } from "../utils/AppDataSource";
import { InternalNote } from "../entities/InternalNote";

export class InternalNoteRepository {
  private repository: Repository<InternalNote>;

  constructor() {
    this.repository = AppDataSource.getRepository(InternalNote);
  }

  async create(noteData: {
    content: string;
    reportId: number;
    authorId: number;
    authorRole: string;
  }): Promise<InternalNote> {
    const note = this.repository.create(noteData);
    const savedNote = await this.repository.save(note);
    
    // Ricarica con le relazioni
    const noteWithRelations = await this.repository.findOne({
      where: { id: savedNote.id },
      relations: ["author"]
    });
    
    return noteWithRelations!;
  }

  async findByReportId(reportId: number): Promise<InternalNote[]> {
    return await this.repository.find({
      where: { reportId },
      relations: ["author"],
      order: { createdAt: "ASC" }
    });
  }

  async findById(id: number): Promise<InternalNote | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["author", "report"]
    });
  }

  async update(id: number, content: string): Promise<InternalNote | null> {
    const note = await this.findById(id);
    if (!note) {
      return null;
    }
    note.content = content;
    return await this.repository.save(note);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
