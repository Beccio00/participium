import { Repository, In } from "typeorm";
import { AppDataSource } from "../utils/AppDataSource";
import { Report, ReportCategory, ReportStatus } from "../entities/Report";

export class ReportRepository {
  private repository: Repository<Report>;

  constructor() {
    this.repository = AppDataSource.getRepository(Report);
  }

  async findById(id: number): Promise<Report | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByIdWithRelations(id: number): Promise<Report | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["user", "assignedTo", "photos", "messages", "messages.user"]
    });
  }

  async findByStatus(statuses: ReportStatus[]): Promise<Report[]> {
    return await this.repository.find({
      where: { status: In(statuses) },
      relations: ["user", "photos", "messages", "messages.user"],
      order: { createdAt: "DESC" }
    });
  }

  async findByStatusAndCategory(statuses: ReportStatus[], category?: ReportCategory): Promise<Report[]> {
    const whereCondition: any = { status: In(statuses) };
    if (category) {
      whereCondition.category = category;
    }

    return await this.repository.find({
      where: whereCondition,
      relations: ["user", "photos", "messages", "messages.user"],
      order: { createdAt: "DESC" }
    });
  }

  async findAssignedToUser(userId: number, statuses: ReportStatus[]): Promise<Report[]> {
    return await this.repository.find({
      where: {
        assignedToId: userId,
        status: In(statuses)
      },
      relations: ["user", "assignedTo", "photos", "messages", "messages.user"],
      order: { createdAt: "DESC" }
    });
  }

  async create(reportData: Partial<Report>): Promise<Report> {
    const now = new Date();
    const reportWithDates = {
      ...reportData,
      createdAt: now,
      updatedAt: now
    };
    
    const report = this.repository.create(reportWithDates);
    const savedReport = await this.repository.save(report);
    return savedReport;
  }

  async update(id: number, reportData: Partial<Report>): Promise<Report | null> {
    await this.repository.update(id, reportData);
    return await this.findByIdWithRelations(id);
  }

  async findByCategory(category: ReportCategory): Promise<Report | null> {
    return await this.repository.findOne({
      where: { category },
      select: ["category"]
    });
  }
}