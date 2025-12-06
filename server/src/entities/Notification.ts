import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { NotificationType } from "../../../shared/ReportTypes";

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