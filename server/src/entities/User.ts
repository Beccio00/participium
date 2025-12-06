import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Report } from "./Report";
import { ReportMessage } from "./ReportMessage";
import { Notification } from "./Notification";
import { CitizenPhoto } from "./CitizenPhoto";
import { Role } from "../../../shared/RoleTypes";

@Entity("User")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column()
  password: string;

  @Column()
  salt: string;

  @Column({
    type: "enum",
    enum: Role,
    default: Role.CITIZEN,
  })
  role: Role;

  @Column({ type: "varchar", nullable: true })
  telegram_username: string | null;

  // Email notification preference for report updates
  @Column({ default: true })
  email_notifications_enabled: boolean;

  // PT27: Email verification status - user must verify email to use the system
  @Column({ default: false })
  isVerified: boolean;

  // PT27: 6-digit verification code sent via email (hashed for security)
  @Column({ type: "varchar", nullable: true })
  verificationToken: string | null;

  // PT27: Expiration timestamp for verification code (valid for 30 minutes)
  @Column({ type: "timestamp", nullable: true })
  verificationCodeExpiresAt: Date | null;

  @OneToMany("Report", "user")
  reports: Report[];

  @OneToMany("ReportMessage", "user")
  messages: ReportMessage[];

  @OneToMany("Report", "assignedOfficer")
  assignedReports: Report[];

  @OneToMany("Notification", "user")
  notifications: Notification[];

  @OneToOne("CitizenPhoto", "user")
  photo: CitizenPhoto;

  @Column({ type: "int", nullable: true })
  externalCompanyId: number | null;

  @ManyToOne("ExternalCompany", "maintainers", { nullable: true })
  @JoinColumn({ name: "externalCompanyId" })
  externalCompany: import("./ExternalCompany").ExternalCompany | null;
}