import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { JoinTeamDto } from './dto/join-team.dto';
import { AuthenticatedUser } from '../auth/auth.types';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

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

  @Post(':teamId/leave')
  leave(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.teamsService.leave(teamId, req.user.userId);
  }

  @Post(':teamId/members/:userId/remove')
  removeMember(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.teamsService.removeMember(teamId, userId, req.user.userId);
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

  @Patch(':teamId/tasks/:taskId/edit')
  updateTask(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: UpdateTaskDto,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.teamsService.updateTask(teamId, taskId, req.user.userId, dto);
  }

  @Delete(':teamId/tasks/:taskId')
  deleteTask(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.teamsService.deleteTask(teamId, taskId, req.user.userId);
  }

  @Post(':teamId/tasks/:taskId/comments')
  addComment(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: CreateCommentDto,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.teamsService.addTaskComment(
      teamId,
      taskId,
      req.user.userId,
      dto.text,
    );
  }

  @Post(':teamId/tasks/:taskId/files')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
    }),
  )
  uploadFile(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @UploadedFile() file: { originalname: string; filename: string; size: number },
    @Req() req: { user: AuthenticatedUser },
  ) {
    if (!file) {
      throw new BadRequestException('Файл не загружен');
    }
    const fileUrl = `/uploads/${file.filename}`;
    return this.teamsService.uploadTaskFile(
      teamId,
      taskId,
      req.user.userId,
      file.originalname,
      fileUrl,
      file.size,
    );
  }
}
