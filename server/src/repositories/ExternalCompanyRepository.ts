import { In, Repository } from "typeorm";
import { AppDataSource } from "../utils/AppDataSource";
import { ExternalCompany } from "../entities/ExternalCompany";
import { ReportCategory } from "../../../shared/ReportTypes";

export class ExternalCompanyRepository {
  private repository: Repository<ExternalCompany>;

  constructor() {
    this.repository = AppDataSource.getRepository(ExternalCompany);
  }

  async findById(id: number): Promise<ExternalCompany | null> {
    return await this.repository.findOne({ 
      where: { id },
      relations: ["maintainers"]
    });
  }

  async findByCategory(category: ReportCategory): Promise<ExternalCompany[]> {
    const companies = await this.repository.find({ relations: ["maintainers"] });
    return companies.filter(c => Array.isArray(c.categories) && c.categories.includes(category));
  }

  async findWithMaintainersByIds(ids: number[]): Promise<ExternalCompany[]> {
    return await this.repository.find({
      where: { id: In(ids) },
      relations: ["maintainers"]
    });
  }

  async create(data: Partial<ExternalCompany>): Promise<ExternalCompany> {
    return await this.repository.save(data);
  }

  async findAll(): Promise<ExternalCompany[]> {
    return await this.repository.find({ relations: ["maintainers"] });
  }

  async findByPlatformAccess(platformAccess: boolean): Promise<ExternalCompany[]> {
    return await this.repository.find({ 
      where: { platformAccess },
      relations: ["maintainers"]
    });
  }

  async deleteById(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
