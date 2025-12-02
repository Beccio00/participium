import { Repository } from "typeorm";
import { AppDataSource } from "../utils/AppDataSource";
import { CitizenPhoto } from "../entities/CitizenPhoto";

export class CitizenPhotoRepository {
  private repository: Repository<CitizenPhoto>;

  constructor() {
    this.repository = AppDataSource.getRepository(CitizenPhoto);
  }

  async findByUserId(userId: number): Promise<CitizenPhoto | null> {
    return await this.repository.findOne({ where: { userId } });
  }

  async create(photoData: Partial<CitizenPhoto>): Promise<CitizenPhoto> {
    const photo = this.repository.create(photoData);
    return await this.repository.save(photo);
  }

  async updateByUserId(userId: number, photoData: Partial<CitizenPhoto>): Promise<CitizenPhoto | null> {
    await this.repository.update({ userId }, photoData);
    return await this.findByUserId(userId);
  }

  async deleteByUserId(userId: number): Promise<boolean> {
    const result = await this.repository.delete({ userId });
    return result.affected !== 0;
  }
}