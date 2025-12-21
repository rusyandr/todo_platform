import { Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from './user.entity';
import { Subject } from './subject.entity';

@Entity()
@Unique('UQ_subject_participant_user_subject', ['user', 'subject'])
export class SubjectParticipant {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
  subject: Subject;
}
