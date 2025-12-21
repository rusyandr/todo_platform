import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Team } from './team.entity';
import { SubjectParticipant } from './subject-participant.entity';

@Entity()
export class Subject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ unique: true })
  joinCode: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  deadline: Date | null;

  @ManyToOne(() => User, (user) => user.createdSubjects, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  createdBy: User | null;

  @OneToMany(() => Team, (team) => team.subject)
  teams: Team[];

  @OneToMany(() => SubjectParticipant, (participant) => participant.subject)
  subjectParticipants: SubjectParticipant[];
}
