import {
  ConflictException,
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

  async create(dto: CreateSubjectDto, hostId: number): Promise<Subject> {
    const host = await this.usersService.findById(hostId);
    if (!host) {
      throw new NotFoundException('Пользователь не найден');
    }

    const subject = this.subjectsRepository.create({
      title: dto.title,
      description: dto.description ?? null,
      deadline: dto.deadline ? new Date(dto.deadline) : null,
      joinCode: await this.generateUniqueJoinCode(),
      createdBy: host,
    });

    const saved = await this.subjectsRepository.save(subject);

    const participant = this.participantsRepository.create({
      subject: saved,
      user: host,
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
