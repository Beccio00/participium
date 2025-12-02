import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("ReportPhoto")
export class ReportPhoto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column()
  filename: string;

  @Column()
  reportId: number;

  @ManyToOne("Report", "photos")
  @JoinColumn({ name: "reportId" })
  report: import("./Report").Report;
}