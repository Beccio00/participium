import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from "typeorm";
// Story 10: Municipality users can have multiple roles
// This entity supports multi-role assignment via the 'role' array field
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

  /**
   * Roles assigned to the user. Supports multiple roles for municipality staff.
   * Example: [Role.ADMINISTRATOR, Role.PUBLIC_RELATIONS]
   * Story 10: Multi-role assignment for municipality users
   */
  @Column({
    type: "enum",
    enum: Role,
    array: true,
    default: [Role.CITIZEN],
  })
  role: Role[];

  // Telegram username for notifications (optional)
  @Column({ type: "varchar", nullable: true })
  telegram_username: string | null;

  // Telegram user ID (optional, unique)
  @Column({ type: "varchar", nullable: true, unique: true })
  telegram_id: string | null;


  // Email notifications enabled flag
  @Column({ default: true })
  email_notifications_enabled: boolean;

  // Email verified flag
  @Column({ default: false })
  isVerified: boolean;

  // Email verification token (optional)
  @Column({ type: "varchar", nullable: true })
  verificationToken: string | null;

  @Column({ type: "timestamp", nullable: true })
  // Expiration date for email verification code
  verificationCodeExpiresAt: Date | null;

  // Reports created by this user
  @OneToMany("Report", "user")
  reports: Report[];

  // Messages sent by this user
  @OneToMany("ReportMessage", "user")
  messages: ReportMessage[];

  // Reports assigned to this user as officer
  @OneToMany("Report", "assignedOfficer")
  assignedReports: Report[];

  // Notifications for this user
  @OneToMany("Notification", "user")
  notifications: Notification[];

  // Profile photo (citizen only)
  @OneToOne("CitizenPhoto", "user")
  photo: CitizenPhoto;

  // External company ID (for external maintainers)
  @Column({ type: "int", nullable: true })
  externalCompanyId: number | null;

  // Reference to external company entity (for external maintainers)
  @ManyToOne("ExternalCompany", "maintainers", { nullable: true })
  @JoinColumn({ name: "externalCompanyId" })
  externalCompany: import("./ExternalCompany").ExternalCompany | null;

  // Internal notes authored by this user (technical staff)
  @OneToMany("InternalNote", "author")
  internalNotes: import("./InternalNote").InternalNote[];
}