import { Repository } from "typeorm";
import { AppDataSource } from "../utils/AppDataSource";
import { ReportMessage } from "../entities/ReportMessage";

export class ReportMessageRepository {
  private repository: Repository<ReportMessage>;

  constructor() {
    this.repository = AppDataSource.getRepository(ReportMessage);
  }

  async findByReportId(reportId: number): Promise<ReportMessage[]> {
    return await this.repository.find({
      where: { reportId },
      relations: ["user"],
      order: { createdAt: "ASC" }
    });
  }

  async create(messageData: Partial<ReportMessage>): Promise<ReportMessage> {
    const message = this.repository.create(messageData);
    const saved = await this.repository.save(message);
    
    // Return with user relation loaded
    return await this.repository.findOne({
      where: { id: saved.id },
      relations: ["user"]
    }) as ReportMessage;
  }

  async findById(id: number): Promise<ReportMessage | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["user", "report"]
    });
  }
}