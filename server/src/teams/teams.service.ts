import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import { Subject } from '../entities/subject.entity';
import { User } from '../entities/user.entity';
import { TeamMember } from '../entities/team-member.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { JoinTeamDto } from './dto/join-team.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { SubjectParticipant } from '../entities/subject-participant.entity';
import { Task } from '../entities/task.entity';
import { TaskAssignee } from '../entities/task-assignee.entity';
import { TaskDependency } from '../entities/task-dependency.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamsRepository: Repository<Team>,
    @InjectRepository(Subject)
    private readonly subjectsRepository: Repository<Subject>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(TeamMember)
    private readonly teamMembersRepository: Repository<TeamMember>,
    @InjectRepository(SubjectParticipant)
    private readonly subjectParticipantsRepository: Repository<SubjectParticipant>,
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(TaskAssignee)
    private readonly taskAssigneesRepository: Repository<TaskAssignee>,
    @InjectRepository(TaskDependency)
    private readonly taskDependenciesRepository: Repository<TaskDependency>,
  ) {}

  async create(userId: number, dto: CreateTeamDto): Promise<Team> {
    const [subject, user] = await Promise.all([
      this.subjectsRepository.findOne({ where: { id: dto.subjectId } }),
      this.usersRepository.findOne({ where: { id: userId } }),
    ]);

    if (!subject) {
      throw new NotFoundException('Предмет не найден');
    }
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const membershipExists = await this.teamMembersRepository.findOne({
      where: {
        user: { id: userId },
        subject: { id: subject.id },
      },
      relations: ['user', 'subject'],
    });

    if (membershipExists) {
      throw new ConflictException(
        'Вы уже состоите в команде по этому предмету',
      );
    }

    await this.ensureSubjectParticipation(user, subject);

    const team = this.teamsRepository.create({
      name: dto.name,
      subject,
      admin: user,
      joinCode: await this.generateUniqueJoinCode(),
      deadline: dto.deadline ? new Date(dto.deadline) : null,
    });

    await this.teamsRepository.save(team);

    const adminMembership = this.teamMembersRepository.create({
      team,
      user,
      subject,
      role: 'admin',
    });

    await this.teamMembersRepository.save(adminMembership);

    return team;
  }

  findForUser(userId: number) {
    return this.teamMembersRepository.find({
      where: { user: { id: userId } },
      relations: ['team', 'team.subject', 'team.admin', 'team.members'],
      order: {
        team: {
          deadline: 'ASC',
          id: 'ASC',
        },
      },
    });
  }

  async joinByCode(userId: number, dto: JoinTeamDto) {
    const [user, membership] = await Promise.all([
      this.usersRepository.findOne({ where: { id: userId } }),
      this.teamMembersRepository.findOne({
        where: { user: { id: userId }, team: { joinCode: dto.joinCode } },
        relations: ['team', 'team.subject'],
      }),
    ]);

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    if (membership) {
      throw new ConflictException('Вы уже в этой команде');
    }

    const team = await this.teamsRepository.findOne({
      where: { joinCode: dto.joinCode },
      relations: ['subject'],
    });

    if (!team) {
      throw new NotFoundException('Команда с таким кодом не найдена');
    }

    const existingBySubject = await this.teamMembersRepository.findOne({
      where: { user: { id: userId }, subject: { id: team.subject.id } },
    });

    if (existingBySubject) {
      throw new ConflictException(
        'Вы уже состоите в команде по этому предмету',
      );
    }

    await this.ensureSubjectParticipation(user, team.subject);

    const member = this.teamMembersRepository.create({
      team,
      user,
      subject: team.subject,
      role: 'member',
    });

    await this.teamMembersRepository.save(member);

    return team;
  }

  async getTeamDetails(teamId: number, userId: number) {
    const membership = await this.getMembership(teamId, userId);

    const team = await this.teamsRepository.findOne({
      where: { id: teamId },
      relations: [
        'subject',
        'members',
        'members.user',
        'tasks',
        'tasks.assignees',
        'tasks.assignees.user',
        'tasks.dependencies',
        'tasks.dependencies.dependsOn',
        'tasks.completedBy',
      ],
      order: {
        tasks: {
          createdAt: 'ASC',
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Команда не найдена');
    }

    return {
      id: team.id,
      name: team.name,
      joinCode: team.joinCode,
      deadline: team.deadline,
      subject: team.subject,
      isAdmin: membership.role === 'admin',
      members: team.members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
        role: member.role,
      })),
      tasks: team.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        isCompleted: task.isCompleted,
        createdAt: task.createdAt,
        completedById: task.completedBy?.id ?? null,
        assignees: task.assignees.map((assignee) => ({
          id: assignee.user.id,
          name: assignee.user.name,
        })),
        dependencies: task.dependencies.map((dep) => ({
          id: dep.dependsOn.id,
          title: dep.dependsOn.title,
          isCompleted: dep.dependsOn.isCompleted,
        })),
      })),
    };
  }

  async createTask(teamId: number, userId: number, dto: CreateTaskDto) {
    const membership = await this.getMembership(teamId, userId);
    if (membership.role !== 'admin') {
      throw new ForbiddenException(
        'Добавлять задачи может только админ команды',
      );
    }

    const assigneeIds = dto.assigneeIds ?? [];
    const assignees = assigneeIds.length
      ? await this.teamMembersRepository.find({
          where: {
            team: { id: teamId },
            user: { id: In(assigneeIds) },
          },
          relations: ['user'],
        })
      : [];

    if (assignees.length !== assigneeIds.length) {
      throw new NotFoundException(
        'Некоторые ответственные не найдены в команде',
      );
    }

    const dependencies = dto.dependencyIds?.length
      ? await this.tasksRepository.find({
          where: { id: In(dto.dependencyIds), team: { id: teamId } },
        })
      : [];

    if ((dto.dependencyIds?.length ?? 0) !== dependencies.length) {
      throw new NotFoundException('Некоторые зависимости не найдены');
    }

    const task = this.tasksRepository.create({
      team: membership.team,
      title: dto.title,
      description: dto.description ?? null,
      deadline: dto.deadline ? new Date(dto.deadline) : null,
      createdBy: membership.user,
    });

    const savedTask = await this.tasksRepository.save(task);

    if (assignees.length) {
      const assigneeEntities = assignees.map((member) =>
        this.taskAssigneesRepository.create({
          task: savedTask,
          user: member.user,
        }),
      );
      await this.taskAssigneesRepository.save(assigneeEntities);
    }

    if (dependencies.length) {
      const depEntities = dependencies.map((dependsOn) =>
        this.taskDependenciesRepository.create({
          task: savedTask,
          dependsOn,
        }),
      );
      await this.taskDependenciesRepository.save(depEntities);
    }

    return this.getTaskWithRelations(savedTask.id);
  }

  async updateTaskStatus(
    teamId: number,
    taskId: number,
    userId: number,
    dto: UpdateTaskStatusDto,
  ) {
    const membership = await this.getMembership(teamId, userId);

    const task = await this.tasksRepository.findOne({
      where: { id: taskId, team: { id: teamId } },
      relations: [
        'assignees',
        'assignees.user',
        'dependencies',
        'dependencies.dependsOn',
      ],
    });

    if (!task) {
      throw new NotFoundException('Задача не найдена');
    }

    const isAssignee = task.assignees.some(
      (assignee) => assignee.user.id === userId,
    );
    if (membership.role !== 'admin' && !isAssignee) {
      throw new ForbiddenException(
        'Отметить задачу может только админ или ответственный',
      );
    }

    if (dto.isCompleted) {
      const blocked = task.dependencies.some(
        (dep) => !dep.dependsOn.isCompleted,
      );
      if (blocked) {
        throw new ConflictException(
          'Есть незавершенные задачи, от которых зависит эта задача',
        );
      }
      task.isCompleted = true;
      task.completedAt = new Date();
      task.completedBy = membership.user;
    } else {
      task.isCompleted = false;
      task.completedAt = null;
      task.completedBy = null;
    }

    await this.tasksRepository.save(task);
    return this.getTaskWithRelations(task.id);
  }

  private async generateUniqueJoinCode(length = 8): Promise<string> {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    while (true) {
      let code = '';
      for (let i = 0; i < length; i += 1) {
        const index = Math.floor(Math.random() * alphabet.length);
        code += alphabet[index];
      }

      const exists = await this.teamsRepository.exist({
        where: { joinCode: code },
      });

      if (!exists) {
        return code;
      }
    }
  }

  private async ensureSubjectParticipation(user: User, subject: Subject) {
    const exists = await this.subjectParticipantsRepository.findOne({
      where: { user: { id: user.id }, subject: { id: subject.id } },
    });

    if (!exists) {
      const participant = this.subjectParticipantsRepository.create({
        user,
        subject,
      });
      await this.subjectParticipantsRepository.save(participant);
    }
  }

  private async getMembership(teamId: number, userId: number) {
    const membership = await this.teamMembersRepository.findOne({
      where: { team: { id: teamId }, user: { id: userId } },
      relations: ['team', 'team.subject', 'user'],
    });

    if (!membership) {
      throw new NotFoundException('Команда не найдена или нет доступа');
    }

    return membership;
  }

  private getTaskWithRelations(taskId: number) {
    return this.tasksRepository.findOne({
      where: { id: taskId },
      relations: [
        'team',
        'assignees',
        'assignees.user',
        'dependencies',
        'dependencies.dependsOn',
        'completedBy',
      ],
    });
  }
}
