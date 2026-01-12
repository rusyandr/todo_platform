import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from '../entities/subject.entity';
import { UsersService } from '../users/users.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { SubjectParticipant } from '../entities/subject-participant.entity';
import { JoinSubjectDto } from './dto/join-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectsRepository: Repository<Subject>,
    @InjectRepository(SubjectParticipant)
    private readonly participantsRepository: Repository<SubjectParticipant>,
    private readonly usersService: UsersService,
  ) {}

  findForUser(userId: number): Promise<Subject[]> {
    return this.subjectsRepository
      .createQueryBuilder('subject')
      .leftJoinAndSelect('subject.createdBy', 'createdBy')
      .leftJoinAndSelect('subject.teams', 'teams')
      .leftJoinAndSelect('teams.admin', 'teamAdmin')
      .leftJoinAndSelect('teams.members', 'teamMembers')
      .leftJoinAndSelect('teamMembers.user', 'teamMemberUsers')
      .leftJoinAndSelect('subject.subjectParticipants', 'subjectParticipants')
      .leftJoinAndSelect('subjectParticipants.user', 'subjectParticipantUsers')
      .where('subjectParticipants.userId = :userId OR createdBy.id = :userId', {
        userId,
      })
      .orderBy('subject.id', 'ASC')
      .getMany();
  }

  async create(dto: CreateSubjectDto, teacherId: number): Promise<Subject> {
    const teacher = await this.usersService.findById(teacherId);
    if (!teacher) {
      throw new NotFoundException('Пользователь не найден');
    }

    let deadline: Date | null = null;
    if (dto.deadline) {
      const deadlineDate = new Date(dto.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadlineDay = new Date(deadlineDate);
      deadlineDay.setHours(0, 0, 0, 0);

      if (deadlineDay < today) {
        throw new BadRequestException('Дедлайн не может быть раньше текущей даты');
      }

      deadlineDate.setHours(23, 59, 0, 0);
      deadline = deadlineDate;
    }

    const subject = this.subjectsRepository.create({
      title: dto.title,
      description: dto.description ?? null,
      deadline,
      joinCode: await this.generateUniqueJoinCode(),
      createdBy: teacher,
    });

    const saved = await this.subjectsRepository.save(subject);

    const participant = this.participantsRepository.create({
      subject: saved,
      user: teacher,
    });

    await this.participantsRepository.save(participant);

    return saved;
  }

  async join(dto: JoinSubjectDto, userId: number) {
    const joinCode = dto.joinCode.trim().toUpperCase();
    const [subject, user] = await Promise.all([
      this.subjectsRepository.findOne({ where: { joinCode } }),
      this.usersService.findById(userId),
    ]);

    if (!subject) {
      throw new NotFoundException('Предмет с таким кодом не найден');
    }
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const exists = await this.participantsRepository.findOne({
      where: { subject: { id: subject.id }, user: { id: user.id } },
    });

    if (exists) {
      throw new ConflictException('Вы уже добавлены на этот предмет');
    }

    const participant = this.participantsRepository.create({ subject, user });
    await this.participantsRepository.save(participant);

    return subject;
  }

  async leave(subjectId: number, userId: number) {
    const subject = await this.subjectsRepository.findOne({
      where: { id: subjectId },
      relations: ['createdBy'],
    });

    if (!subject) {
      throw new NotFoundException('Предмет не найден');
    }

    const participant = await this.participantsRepository.findOne({
      where: { subject: { id: subjectId }, user: { id: userId } },
    });

    if (!participant) {
      throw new NotFoundException('Вы не состоите в этом предмете');
    }

    if (subject.createdBy?.id === userId) {
      await this.subjectsRepository.remove(subject);
      return { success: true, deleted: true };
    }

    await this.participantsRepository.remove(participant);
    return { success: true, deleted: false };
  }

  private async generateUniqueJoinCode(length = 6): Promise<string> {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';

    while (true) {
      let code = '';
      for (let i = 0; i < length; i += 1) {
        const index = Math.floor(Math.random() * alphabet.length);
        code += alphabet[index];
      }

      const exists = await this.subjectsRepository.exist({
        where: { joinCode: code },
      });
      if (!exists) {
        return code;
      }
    }
  }
}
