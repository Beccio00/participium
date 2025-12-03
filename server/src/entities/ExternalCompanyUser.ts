import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ExternalCompany } from "./ExternalCompany";
import { User } from "./User";

@Entity("ExternalCompanyUser")
export class ExternalCompanyUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  companyId: number;

  @Column()
  userId: number;

  @ManyToOne("ExternalCompany", "companyUsers")
  @JoinColumn({ name: "companyId" })
  company: ExternalCompany;

  @ManyToOne("User", "externalCompanies")
  @JoinColumn({ name: "userId" })
  user: User;
}
