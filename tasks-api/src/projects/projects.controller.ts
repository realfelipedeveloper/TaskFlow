import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectsService } from './projects.service';
import { UsersService } from '../users/users.service';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService,
  ) {}

  private async checkAdmin(req: any) {
    const isAdmin = await this.usersService.isAdmin(req.user?.userId);
    if (!isAdmin) {
      throw new ForbiddenException('Acesso restrito a administradores');
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Req() req: any) {
    await this.checkAdmin(req);
    return this.projectsService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('select')
  findSelect() {
    return this.projectsService.findSelect();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Req() req: any, @Body() body: { name: string; description?: string | null }) {
    await this.checkAdmin(req);
    return this.projectsService.create(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string | null },
  ) {
    await this.checkAdmin(req);
    return this.projectsService.update(+id, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.checkAdmin(req);
    return this.projectsService.remove(+id);
  }
}
