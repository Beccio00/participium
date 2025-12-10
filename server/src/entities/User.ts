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

  @Column({ default: true })
  email_notifications_enabled: boolean;

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

  @OneToMany("InternalNote", "author")
  internalNotes: import("./InternalNote").InternalNote[];
}