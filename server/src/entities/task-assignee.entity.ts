import { Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Task } from './task.entity';
import { User } from './user.entity';

@Entity()
@Unique('UQ_task_assignee', ['task', 'user'])
export class TaskAssignee {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Task, (task) => task.assignees, {
    onDelete: 'CASCADE',
  })
  task: Task;

  @ManyToOne(() => User, (user) => user.taskAssignments, {
    onDelete: 'CASCADE',
  })
  user: User;
}
