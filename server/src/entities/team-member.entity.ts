import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Team } from './team.entity';
import { User } from './user.entity';
import { Subject } from './subject.entity';

@Entity()
@Unique('UQ_team_member_user_subject', ['user', 'subject'])
export class TeamMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Team, (team) => team.members, {
    onDelete: 'CASCADE',
  })
  team: Team;

  @ManyToOne(() => User, (user) => user.memberships, {
    onDelete: 'CASCADE',
  })
  user: User;

  // Дублируем предмет для удобной проверки "одна команда на предмет"
  @ManyToOne(() => Subject, {
    onDelete: 'CASCADE',
  })
  subject: Subject;

  @Column({ default: 'member' })
  role: 'admin' | 'member';
}
