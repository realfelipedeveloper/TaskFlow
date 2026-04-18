import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TasksService } from './tasks.service';
import type { TaskPayloadDto } from './dto/task.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadedFiles, UseInterceptors } from '@nestjs/common';

@UseGuards(AuthGuard('jwt'))
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('dashboard')
  getDashboard(@Query('projectId') projectId?: string) {
    return this.tasksService.getDashboard(projectId ? +projectId : undefined);
  }

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.tasksService.findAll(projectId ? +projectId : undefined);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  create(
    @Body() createTaskDto: TaskPayloadDto,
    @UploadedFiles() files: any[],
  ) {
    return this.tasksService.create(createTaskDto, files);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files'))
  update(
    @Param('id') id: string, 
    @Body() updateTaskDto: TaskPayloadDto, 
    @UploadedFiles() files?: any[]
  ) {
    return this.tasksService.update(+id, updateTaskDto, files);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(+id);
  }
}
