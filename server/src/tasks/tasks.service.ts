import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
  ) {}

  findAll(): Promise<Task[]> {
    return this.tasksRepository.find({
      relations: ['team', 'team.subject', 'assignees', 'assignees.user'],
      order: { order: 'ASC', id: 'ASC' },
    });
  }

  async markCompleted(id: number): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    task.isCompleted = true;
    task.completedAt = new Date();
    return this.tasksRepository.save(task);
  }
}
