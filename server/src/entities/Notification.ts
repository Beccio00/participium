import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";

export enum NotificationType {
  REPORT_STATUS_CHANGED = "REPORT_STATUS_CHANGED",
  MESSAGE_RECEIVED = "MESSAGE_RECEIVED",
  REPORT_ASSIGNED = "REPORT_ASSIGNED",
  REPORT_APPROVED = "REPORT_APPROVED",
  REPORT_REJECTED = "REPORT_REJECTED",
}

@Entity("Notification")
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "enum",
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  userId: number;

  @Column({ type: "int", nullable: true })
  reportId: number | null;

  @ManyToOne("User", "notifications")
  @JoinColumn({ name: "userId" })
  user: import("./User").User;

  @ManyToOne("Report", "notifications", { nullable: true })
  @JoinColumn({ name: "reportId" })
  report: import("./Report").Report;
}