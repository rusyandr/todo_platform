import { Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Task } from './task.entity';

@Entity()
@Unique('UQ_task_dependency', ['task', 'dependsOn'])
export class TaskDependency {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Task, (task) => task.dependencies, {
    onDelete: 'CASCADE',
  })
  task: Task;

  @ManyToOne(() => Task, (task) => task.dependents, {
    onDelete: 'CASCADE',
  })
  dependsOn: Task;
}
