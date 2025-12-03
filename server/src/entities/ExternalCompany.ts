import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from "typeorm";
import { ReportCategory } from "./Report";
import { Report } from "./Report";
import { ExternalCompanyUser } from "./ExternalCompanyUser";

@Entity("ExternalCompany")
export class ExternalCompany {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: "enum",
    enum: ReportCategory,
  })
  category: ReportCategory;

  @Column({ default: false })
  hasPlatformAccess: boolean;

  @OneToMany("ExternalCompanyUser", "company")
  companyUsers: ExternalCompanyUser[];

  @OneToMany("Report", "externalCompany")
  reports: Report[];
}
