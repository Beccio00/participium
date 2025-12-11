import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";

@Entity("InternalNote")
export class InternalNote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text")
  content: string;

  @Column()
  reportId: number;

  @Column()
  authorId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne("Report", "internalNotes")
  @JoinColumn({ name: "reportId" })
  report: import("./Report").Report;

  @ManyToOne("User", "internalNotes")
  @JoinColumn({ name: "authorId" })
  author: import("./User").User;
}