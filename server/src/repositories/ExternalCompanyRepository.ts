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
    return await this.repository.findOne({ where: { id } });
  }

  async findByCategory(category: ReportCategory): Promise<ExternalCompany[]> {
    // categories stored as simple-json array; filter in memory after fetching all could be heavy.
    // Fetch all, then filter by includes.
    const companies = await this.repository.find({ relations: ["maintainers"] });
    return companies.filter(c => Array.isArray(c.categories) && c.categories.includes(category));
  }

  async findWithMaintainersByIds(ids: number[]): Promise<ExternalCompany[]> {
    return await this.repository.find({
      where: { id: In(ids) },
      relations: ["maintainers"]
    });
  }
}
