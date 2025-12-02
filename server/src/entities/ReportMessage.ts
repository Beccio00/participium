import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";

@Entity("ReportMessage")
export class ReportMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  reportId: number;

  @Column()
  senderId: number;

  @ManyToOne("Report", "messages")
  @JoinColumn({ name: "reportId" })
  report: import("./Report").Report;

  @ManyToOne("User", "messages")
  @JoinColumn({ name: "senderId" })
  user: import("./User").User;
}