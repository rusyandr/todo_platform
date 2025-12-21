import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from '../entities/subject.entity';
import { UsersModule } from '../users/users.module';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { SubjectParticipant } from '../entities/subject-participant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subject, SubjectParticipant]),
    UsersModule,
  ],
  controllers: [SubjectsController],
  providers: [SubjectsService],
  exports: [SubjectsService],
})
export class SubjectsModule {}
