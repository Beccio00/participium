import { Repository } from "typeorm";
import { AppDataSource } from "../utils/AppDataSource";
import { User, Role } from "../entities/User";

export class UserRepository {
  private repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByIds(ids: number[]): Promise<User[]> {
    return await this.repository.findByIds(ids);
  }

  async findByRoles(roles: Role[]): Promise<User[]> {
    return await this.repository.find({
      where: roles.map(role => ({ role }))
    });
  }

  async countByRole(role: Role): Promise<number> {
    return await this.repository.count({ where: { role } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return await this.repository.save(user);
  }

  async update(id: number, userData: Partial<User>): Promise<User | null> {
    await this.repository.update(id, userData);
    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  async findWithPhoto(id: number): Promise<User | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["photo"]
    });
  }
}