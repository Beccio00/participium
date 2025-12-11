import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index
} from "typeorm";
import { ReportCategory } from "../../../shared/ReportTypes";
import { User } from "./User";
import { Report } from "./Report";

@Entity("ExternalCompany")
export class ExternalCompany {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: "varchar" })
  name: string;

  // Stores the categories handled by the company as an array
  @Column({ type: "simple-json" })
  categories: ReportCategory[];

  @Column({ type: "boolean", default: false })
  platformAccess: boolean;

  @OneToMany("User", "externalCompany")
  maintainers: User[];

  @OneToMany("Report", "externalCompany")
  reports: Report[];
}
