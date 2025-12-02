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

export enum ReportCategory {
  WATER_SUPPLY_DRINKING_WATER = "WATER_SUPPLY_DRINKING_WATER",
  ARCHITECTURAL_BARRIERS = "ARCHITECTURAL_BARRIERS",
  SEWER_SYSTEM = "SEWER_SYSTEM",
  PUBLIC_LIGHTING = "PUBLIC_LIGHTING",
  WASTE = "WASTE",
  ROAD_SIGNS_TRAFFIC_LIGHTS = "ROAD_SIGNS_TRAFFIC_LIGHTS",
  ROADS_URBAN_FURNISHINGS = "ROADS_URBAN_FURNISHINGS",
  PUBLIC_GREEN_AREAS_PLAYGROUNDS = "PUBLIC_GREEN_AREAS_PLAYGROUNDS",
  OTHER = "OTHER",
}

export enum ReportStatus {
  PENDING_APPROVAL = "PENDING_APPROVAL",
  ASSIGNED = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  SUSPENDED = "SUSPENDED",
  REJECTED = "REJECTED",
  RESOLVED = "RESOLVED",
}

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
  assignedToId: number;

  @Column({ type: "text", nullable: true })
  rejectedReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne("User", "reports")
  @JoinColumn({ name: "userId" })
  user: import("./User").User;

  @ManyToOne("User", "assignedReports", { nullable: true })
  @JoinColumn({ name: "assignedToId" })
  assignedTo: import("./User").User;

  @OneToMany("ReportPhoto", "report")
  photos: import("./ReportPhoto").ReportPhoto[];

  @OneToMany("ReportMessage", "report")
  messages: import("./ReportMessage").ReportMessage[];

  @OneToMany("Notification", "report")
  notifications: import("./Notification").Notification[];
}