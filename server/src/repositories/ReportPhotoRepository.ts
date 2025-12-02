import { Repository } from "typeorm";
import { AppDataSource } from "../utils/AppDataSource";
import { ReportPhoto } from "../entities/ReportPhoto";

export class ReportPhotoRepository {
  private repository: Repository<ReportPhoto>;

  constructor() {
    this.repository = AppDataSource.getRepository(ReportPhoto);
  }

  async findByReportId(reportId: number): Promise<ReportPhoto[]> {
    return await this.repository.find({ where: { reportId } });
  }

  async create(photoData: Partial<ReportPhoto>): Promise<ReportPhoto> {
    const photo = this.repository.create(photoData);
    return await this.repository.save(photo);
  }

  async createMany(photosData: Partial<ReportPhoto>[]): Promise<ReportPhoto[]> {
    const photos = this.repository.create(photosData);
    return await this.repository.save(photos);
  }

  async deleteByReportId(reportId: number): Promise<boolean> {
    const result = await this.repository.delete({ reportId });
    return result.affected !== 0;
  }
}