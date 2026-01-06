import { Repository, In } from "typeorm";
import { AppDataSource } from "../utils/AppDataSource";
import { Report } from "../entities/Report";
import { ReportCategory, ReportStatus } from "../../../shared/ReportTypes";
import { BoundingBox } from "../services/geocodingService";

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
        relations: [
          "user",
          "assignedOfficer",
          "photos",
          "messages",
          "messages.user",
          "externalMaintainer",
          "externalMaintainer.externalCompany",
          "externalCompany"
        ]
    });
  }

  async findByStatus(statuses: ReportStatus[]): Promise<Report[]> {
    return await this.repository.find({
      where: { status: In(statuses) },
      relations: [
        "user",
        "photos",
        "messages",
        "messages.user",
        "assignedOfficer",
        "externalMaintainer",
        "externalMaintainer.externalCompany",
        "externalCompany"
      ],
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
      relations: [
        "user",
        "photos",
        "messages",
        "messages.user",
        "assignedOfficer",
        "externalMaintainer",
        "externalMaintainer.externalCompany",
        "externalCompany"
      ],
      order: { createdAt: "DESC" }
    });
  }

  async findByStatusCategoryAndBounds(
    statuses: ReportStatus[], 
    category?: ReportCategory,
    bbox?: BoundingBox
  ): Promise<Report[]> {
    let query = this.repository.createQueryBuilder("report")
      .leftJoinAndSelect("report.user", "user")
      .leftJoinAndSelect("report.photos", "photos")
      .leftJoinAndSelect("report.messages", "messages")
      .leftJoinAndSelect("messages.user", "messageUser")
      .leftJoinAndSelect("report.assignedOfficer", "assignedOfficer")
      .leftJoinAndSelect("report.externalMaintainer", "externalMaintainer")
      .leftJoinAndSelect("externalMaintainer.externalCompany", "externalCompany")
      .leftJoinAndSelect("report.externalCompany", "directExternalCompany")
      .where("report.status IN (:...statuses)", { statuses })
      .orderBy("report.createdAt", "DESC");

    if (category) {
      query = query.andWhere("report.category = :category", { category });
    }

    if (bbox) {
      query = query.andWhere(
        "report.latitude BETWEEN :minLat AND :maxLat AND report.longitude BETWEEN :minLon AND :maxLon",
        {
          minLat: bbox.minLat,
          maxLat: bbox.maxLat,
          minLon: bbox.minLon,
          maxLon: bbox.maxLon
        }
      );
    }

    return await query.getMany();
  }

  async findAssignedToUser(userId: number, statuses: ReportStatus[]): Promise<Report[]> {
    return await this.repository.find({
      where: {
          assignedOfficerId: userId,
        status: In(statuses)
      },
        relations: [
          "user",
          "assignedOfficer",
          "photos",
          "messages",
          "messages.user",
          "externalMaintainer",
          "externalMaintainer.externalCompany",
          "externalCompany"
        ],
      order: { createdAt: "DESC" }
    });
  }

  async findAssignedToExternalMaintainer(externalMaintainerId: number, statuses: ReportStatus[]): Promise<Report[]> {
    return await this.repository.find({
      where: {
        externalMaintainerId: externalMaintainerId,
        status: In(statuses)
      },
      relations: [
        "user",
        "assignedOfficer",
        "photos",
        "messages",
        "messages.user",
        "externalMaintainer",
        "externalMaintainer.externalCompany",
        "externalCompany"
      ],
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

  async findByUserId(userId: number): Promise<Report[]> {
    return await this.repository.find({
      where: { userId }, 
      relations: ["photos"],
      order: { createdAt: "DESC" } 
    });
  }
}