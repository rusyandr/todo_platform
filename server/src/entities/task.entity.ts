import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Team } from './team.entity';
import { User } from './user.entity';
import { TaskAssignee } from './task-assignee.entity';
import { TaskDependency } from './task-dependency.entity';
import { TaskComment } from './task-comment.entity';
import { TaskFile } from './task-file.entity';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Team, (team) => team.tasks, {
    onDelete: 'CASCADE',
  })
  team: Team;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  deadline: Date | null;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.createdTasks, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  createdBy: User | null;

  @ManyToOne(() => User, (user) => user.completedTasks, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  completedBy: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @OneToMany(() => TaskAssignee, (assignee) => assignee.task)
  assignees: TaskAssignee[];

  @OneToMany(() => TaskDependency, (dep) => dep.task)
  dependencies: TaskDependency[];

  @OneToMany(() => TaskDependency, (dep) => dep.dependsOn)
  dependents: TaskDependency[];

  @OneToMany(() => TaskComment, (comment) => comment.task)
  comments: TaskComment[];

  @OneToMany(() => TaskFile, (file) => file.task)
  files: TaskFile[];
}
