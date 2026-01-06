import { Repository } from "typeorm";
import { AppDataSource } from "../utils/AppDataSource";
import { User } from "../entities/User";
import { Role } from "../../../shared/RoleTypes";

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

  async findByTelegramId(telegramId: string): Promise<User | null> {
    return await this.repository.findOne({ where: { telegram_id: telegramId } });
  }

  async findByIds(ids: number[]): Promise<User[]> {
    return await this.repository.findByIds(ids);
  }

  async findByRoles(roles: Role[]): Promise<User[]> {
    if (roles.length === 0) return [];
    return await this.repository.createQueryBuilder("user")
      // && overlap operator of Postgres:  find the records where the 'role' array 
      // has elements in common with the :roles array
      .where("user.role && :roles", { roles }) 
      .getMany();
  }

  async countByRole(role: Role): Promise<number> {
    return await this.repository.createQueryBuilder("user")
      //using ANY: verify if the value :role is present in the user.role array
      .where(":role = ANY(user.role)", { role })
      .getCount();
  }

  //TyperORM should manage the array type automatically, because defined in the entity
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

  async findExternalMaintainersWithCompany(): Promise<User[]> {
    return await this.repository.createQueryBuilder("user")
      .leftJoinAndSelect("user.externalCompany", "externalCompany")
      .where(":role = ANY(user.role)", { role: Role.EXTERNAL_MAINTAINER })
      .getMany();
  }

  async findExternalMaintainerByIdWithCompany(id: number): Promise<User | null> {
    return await this.repository.createQueryBuilder("user")
      .leftJoinAndSelect("user.externalCompany", "externalCompany")
      .where("user.id = :id", { id })
      .andWhere(":role = ANY(user.role)", { role: Role.EXTERNAL_MAINTAINER })
      .getOne();
  }
}