import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Subject } from './subject.entity';
import { User } from './user.entity';
import { TeamMember } from './team-member.entity';
import { Task } from './task.entity';

@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Subject, (subject) => subject.teams, {
    onDelete: 'CASCADE',
  })
  subject: Subject;

  @ManyToOne(() => User, (user) => user.adminTeams, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  admin: User | null;

  @Column({ unique: true })
  joinCode: string;

  @OneToMany(() => TeamMember, (member) => member.team)
  members: TeamMember[];

  @OneToMany(() => Task, (task) => task.team)
  tasks: Task[];
}
