import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Task } from './task.entity';
import { User } from './user.entity';

@Entity()
export class TaskFile {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Task, (task) => task.files, {
    onDelete: 'CASCADE',
  })
  task: Task;

  @ManyToOne(() => User, (user) => user.files, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  uploadedBy: User | null;

  @Column()
  fileUrl: string;

  @Column()
  fileName: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
