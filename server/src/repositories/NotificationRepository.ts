import { Repository } from "typeorm";
import { AppDataSource } from "../utils/AppDataSource";
import { Notification } from "../entities/Notification";

export class NotificationRepository {
  private repository: Repository<Notification>;

  constructor() {
    this.repository = AppDataSource.getRepository(Notification);
  }

  async findById(id: number): Promise<Notification | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByUserId(userId: number, unreadOnly?: boolean, limit?: number): Promise<Notification[]> {
    const whereCondition: any = { userId };
    if (unreadOnly) {
      whereCondition.isRead = false;
    }

    return await this.repository.find({
      where: whereCondition,
      order: { createdAt: "DESC" },
      take: limit
    });
  }

  async create(notificationData: Partial<Notification>): Promise<Notification> {
    const notification = this.repository.create(notificationData);
    return await this.repository.save(notification);
  }

  async markAsRead(id: number): Promise<Notification | null> {
    await this.repository.update(id, { isRead: true });
    return await this.findById(id);
  }

  async markAllAsReadForUser(userId: number): Promise<void> {
    await this.repository.update({ userId }, { isRead: true });
  }
}