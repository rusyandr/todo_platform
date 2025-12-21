import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { hash } from 'bcrypt';
import { User } from '../entities/user.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async seedIfEmpty() {
    this.logger.log('Clearing existing data and seeding base host user...');
    await this.seed();
    this.logger.log('Seeding completed');
  }

  private async seed() {
    await this.clearDatabase();

    const passwordHash: string = await hash('password123', 10);

    const host = this.usersRepo.create({
      email: 'host@example.com',
      name: 'Руслан Агафонов',
      passwordHash,
      role: 'host',
    });

    await this.usersRepo.save(host);
  }

  private async clearDatabase() {
    await this.dataSource.manager.query(`
      TRUNCATE TABLE
        "task_file",
        "task_comment",
        "task_dependency",
        "task_assignee",
        "task",
        "team_member",
        "subject_participant",
        "team",
        "subject",
        "user"
      RESTART IDENTITY CASCADE;
    `);
  }
}
