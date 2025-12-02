import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from "typeorm";

@Entity("CitizenPhoto")
export class CitizenPhoto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column()
  filename: string;

  @Column()
  userId: number;

  @OneToOne("User", "photo")
  @JoinColumn({ name: "userId" })
  user: import("./User").User;
}