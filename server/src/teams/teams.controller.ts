import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { JoinTeamDto } from './dto/join-team.dto';
import { AuthenticatedUser } from '../auth/auth.types';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';

@Controller('teams')
@UseGuards(AuthGuard('jwt'))
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('mine')
  findMine(@Req() req: { user: AuthenticatedUser }) {
    return this.teamsService.findForUser(req.user.userId);
  }

  @Post()
  create(@Body() dto: CreateTeamDto, @Req() req: { user: AuthenticatedUser }) {
    return this.teamsService.create(req.user.userId, dto);
  }

  @Post('join')
  join(@Body() dto: JoinTeamDto, @Req() req: { user: AuthenticatedUser }) {
    return this.teamsService.joinByCode(req.user.userId, dto);
  }

  @Get(':teamId')
  details(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.teamsService.getTeamDetails(teamId, req.user.userId);
  }

  @Post(':teamId/tasks')
  createTask(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body() dto: CreateTaskDto,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.teamsService.createTask(teamId, req.user.userId, dto);
  }

  @Patch(':teamId/tasks/:taskId')
  updateTaskStatus(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: UpdateTaskStatusDto,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.teamsService.updateTaskStatus(
      teamId,
      taskId,
      req.user.userId,
      dto,
    );
  }
}
