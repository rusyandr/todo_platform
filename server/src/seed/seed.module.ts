import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Subject } from '../entities/subject.entity';
import { Team } from '../entities/team.entity';
import { TeamMember } from '../entities/team-member.entity';
import { Task } from '../entities/task.entity';
import { TaskComment } from '../entities/task-comment.entity';
import { TaskFile } from '../entities/task-file.entity';
import { SeedService } from './seed.service';
import { SubjectParticipant } from '../entities/subject-participant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Subject,
      Team,
      TeamMember,
      Task,
      TaskComment,
      TaskFile,
      SubjectParticipant,
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
