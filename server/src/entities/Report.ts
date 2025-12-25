import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./User";
import { ReportPhoto } from "./ReportPhoto";
import { ReportMessage } from "./ReportMessage";
import { Notification } from "./Notification";
import { ExternalCompany } from "./ExternalCompany";
import { ReportCategory, ReportStatus } from "../../../shared/ReportTypes";

@Entity("Report")
@Index("idx_report_status_anonymous", ["status", "isAnonymous"]) // Compound index for public map queries
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

  /**
   * PT15: Whether this report should be displayed anonymously in public listings
   * When true, personal user information is hidden from public API responses
   */
  @Column({ default: false })
  @Index("idx_report_anonymous") // Index for filtering anonymous reports in public views
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