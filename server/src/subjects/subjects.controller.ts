import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { AuthenticatedUser } from '../auth/auth.types';
import { JoinSubjectDto } from './dto/join-subject.dto';

@Controller('subjects')
@UseGuards(AuthGuard('jwt'))
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  findMine(@Req() req: { user: AuthenticatedUser }) {
    return this.subjectsService.findForUser(req.user.userId);
  }

  @Post()
  create(
    @Body() dto: CreateSubjectDto,
    @Req() req: { user: AuthenticatedUser },
  ) {
    if (req.user.role !== 'host') {
      throw new ForbiddenException(
        'Создавать предметы может только хост (преподаватель)',
      );
    }

    return this.subjectsService.create(dto, req.user.userId);
  }

  @Post('join')
  join(@Body() dto: JoinSubjectDto, @Req() req: { user: AuthenticatedUser }) {
    return this.subjectsService.join(dto, req.user.userId);
  }
}
