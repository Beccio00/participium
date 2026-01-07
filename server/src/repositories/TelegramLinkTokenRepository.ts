import { Repository, LessThan } from "typeorm";
import { AppDataSource } from "../utils/AppDataSource";
import { TelegramLinkToken } from "../entities/TelegramLinkToken";

export class TelegramLinkTokenRepository {
  private readonly repository: Repository<TelegramLinkToken>;

  constructor() {
    this.repository = AppDataSource.getRepository(TelegramLinkToken);
  }

  async create(data: Partial<TelegramLinkToken>): Promise<TelegramLinkToken> {
    const token = this.repository.create(data);
    return await this.repository.save(token);
  }

  async findByToken(token: string): Promise<TelegramLinkToken | null> {
    return await this.repository.findOne({
      where: { token },
      relations: ["user"],
    });
  }

  async findValidByToken(token: string): Promise<TelegramLinkToken | null> {
    return await this.repository.findOne({
      where: {
        token,
        used: false,
      },
      relations: ["user"],
    });
  }

  async findByUserId(userId: number): Promise<TelegramLinkToken | null> {
    return await this.repository.findOne({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  async findValidByUserId(userId: number): Promise<TelegramLinkToken | null> {
    return await this.repository.findOne({
      where: {
        userId,
        used: false,
      },
      order: { createdAt: "DESC" },
    });
  }

  async markAsUsed(id: number): Promise<void> {
    await this.repository.update(id, { used: true });
  }

  async deleteByUserId(userId: number): Promise<void> {
    await this.repository.delete({ userId });
  }

  async deleteExpiredTokens(): Promise<number> {
    const result = await this.repository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }
}
