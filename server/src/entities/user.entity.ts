import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Subject } from './subject.entity';
import { Team } from './team.entity';
import { TeamMember } from './team-member.entity';
import { Task } from './task.entity';
import { TaskAssignee } from './task-assignee.entity';
import { TaskComment } from './task-comment.entity';
import { TaskFile } from './task-file.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  passwordHash: string;

  @Column({ default: 'student' })
  role: 'teacher' | 'student';

  @OneToMany(() => Subject, (subject) => subject.createdBy)
  createdSubjects: Subject[];

  @OneToMany(() => Team, (team) => team.admin)
  adminTeams: Team[];

  @OneToMany(() => TeamMember, (member) => member.user)
  memberships: TeamMember[];

  @OneToMany(() => Task, (task) => task.createdBy)
  createdTasks: Task[];

  @OneToMany(() => Task, (task) => task.completedBy)
  completedTasks: Task[];

  @OneToMany(() => TaskAssignee, (assignee) => assignee.user)
  taskAssignments: TaskAssignee[];

  @OneToMany(() => TaskComment, (comment) => comment.author)
  comments: TaskComment[];

  @OneToMany(() => TaskFile, (file) => file.uploadedBy)
  files: TaskFile[];
}
