import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { ReportPhoto } from "./ReportPhoto";
import { ReportMessage } from "./ReportMessage";
import { Notification } from "./Notification";
import { ExternalCompany } from "./ExternalCompany";
import { ReportCategory, ReportStatus } from "../../../shared/ReportTypes";

@Entity("Report")
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({
    type: "enum",
    enum: ReportCategory,
  })
  category: ReportCategory;

  @Column("float")
  latitude: number;

  @Column("float")
  longitude: number;

  @Column({ type: "varchar", nullable: true })
  address: string | null;

  @Column({ default: false })
  isAnonymous: boolean;

  @Column({
    type: "enum",
    enum: ReportStatus,
    default: ReportStatus.PENDING_APPROVAL,
  })
  status: ReportStatus;

  @Column()
  userId: number;

  @Column({ type: "int", nullable: true })
  assignedOfficerId: number | null;

  @Column({ type: "int", nullable: true })
  externalMaintainerId: number | null;

  @Column({ type: "int", nullable: true })
  externalCompanyId: number | null;

  @Column({ type: "text", nullable: true })
  rejectedReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne("User", "reports")
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne("User", "assignedReports", { nullable: true })
  @JoinColumn({ name: "assignedOfficerId" })
  assignedOfficer: User | null;

  @OneToMany("ReportPhoto", "report")
  photos: ReportPhoto[];

  @OneToMany("ReportMessage", "report")
  messages: ReportMessage[];

  @OneToMany("Notification", "report")
  notifications: Notification[];

  @ManyToOne("User", "reports", { nullable: true })
  @JoinColumn({ name: "externalMaintainerId" })
  externalMaintainer: User | null;

  @ManyToOne("ExternalCompany", "reports", { nullable: true })
  @JoinColumn({ name: "externalCompanyId" })
  externalCompany: ExternalCompany | null;

  @OneToMany("InternalNote", "report")
  internalNotes: import("./InternalNote").InternalNote[];
}