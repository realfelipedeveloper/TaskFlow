import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskPayloadDto } from './dto/task.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  private buildProjectWhere(projectId?: number) {
    if (!projectId || !Number.isInteger(projectId) || projectId <= 0) {
      return {};
    }

    return { project_id: projectId };
  }

  private normalizeAssigneeIds(ids?: number[]) {
    if (!Array.isArray(ids)) return [];

    return Array.from(
      new Set(
        ids
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    );
  }

  private async ensureProjectExists(projectId?: number | null) {
    const normalizedProjectId = Number(projectId);

    if (!Number.isInteger(normalizedProjectId) || normalizedProjectId <= 0) {
      throw new BadRequestException('Toda tarefa precisa estar vinculada a um projeto.');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: normalizedProjectId },
      select: { id: true, name: true },
    });

    if (!project) {
      throw new NotFoundException('Projeto nao encontrado.');
    }

    return project;
  }

  private mapTask(task: any) {
    const developers = task.assignees?.map((assignment: any) => assignment.user.name) ?? [];
    const assigneeIds = task.assignees?.map((assignment: any) => assignment.user.id) ?? [];
    const { assignees, project, ...taskData } = task;

    return {
      ...taskData,
      developer: developers,
      assigneeIds,
      projectId: project?.id ?? task.project_id ?? null,
      project,
    };
  }

  async getDashboard(projectId?: number) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const where = this.buildProjectWhere(projectId);

      const [total, inProgress, done, tasks] = await Promise.all([
        this.prisma.task.count({ where: { ...where, status: { not: 'Concluída' } } }),
        this.prisma.task.count({ where: { ...where, status: 'Em andamento' } }),
        this.prisma.task.count({ where: { ...where, status: 'Concluída' } }),
        this.prisma.task.findMany({
          where,
          include: {
            assignees: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
      ]);

      const overdueList = tasks.filter((t) => {
        if (!t.due_date || t.status === 'Concluída') return false;
        const dueDate = new Date(t.due_date);
        return dueDate < today;
      });

      const overdue = overdueList.length;

      const developers = await this.prisma.user.findMany({ select: { name: true } });
      const devMap = new Map<string, number>();
      developers.forEach((d) => devMap.set(d.name, 0));

      tasks
        .filter((task) => task.status !== 'Concluída')
        .forEach((task) => {
          task.assignees.forEach((assignment) => {
            const developer = assignment.user.name;

            if (devMap.has(developer)) {
              devMap.set(developer, (devMap.get(developer) || 0) + 1);
            }
          });
        });

      const devs = Array.from(devMap.entries()).map(([developer, totalTasks]) => ({
        developer,
        total: totalTasks,
      }));

      return {
        total,
        inProgress,
        done,
        overdue,
        devs,
        overdueList: overdueList.map((task) => this.mapTask(task)),
      };
    } catch (error) {
      console.error('Error in getDashboard:', error);
      throw error;
    }
  }

  async findAll(projectId?: number) {
    const where = this.buildProjectWhere(projectId);
    const tasks = await this.prisma.task.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return tasks.map((task) => this.mapTask(task));
  }

  private saveFiles(files?: any[]): string[] {
    if (!files || files.length === 0) return [];

    const uploadDir = path.resolve('public/uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePaths: string[] = [];

    files.forEach((file) => {
      const fileName = `${Date.now()}-${Math.random()}-${file.originalname}`;
      const fullPath = path.join(uploadDir, fileName);

      fs.writeFileSync(fullPath, file.buffer);

      filePaths.push(`/uploads/${fileName}`);
    });

    return filePaths;
  }

  async create(data: TaskPayloadDto, files?: any[]) {
    const { due_date, assigneeIds, projectId, ...rest } = data;
    const normalizedAssigneeIds = this.normalizeAssigneeIds(assigneeIds);
    const project = await this.ensureProjectExists(projectId);
    const filePaths = this.saveFiles(files);

    const task = await this.prisma.task.create({
      data: {
        ...rest,
        files: filePaths,
        due_date: due_date ? new Date(due_date) : null,
        project: {
          connect: { id: project.id },
        },
        assignees: {
          create: normalizedAssigneeIds.map((userId) => ({
            user: {
              connect: { id: userId },
            },
          })),
        },
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapTask(task);
  }

  async update(id: number, data: TaskPayloadDto, files?: any[]) {
    const rawExisting =
      (data as any)['existingFiles'] ||
      (data as any)['existingFiles[]'];

    delete (data as any).existingFiles;
    delete (data as any)['existingFiles[]'];

    const { due_date, assigneeIds, projectId, ...rest } = data;
    const normalizedAssigneeIds = this.normalizeAssigneeIds(assigneeIds);
    const project = await this.ensureProjectExists(projectId);

    let existingFilesArray: string[] = [];

    if (rawExisting) {
      existingFilesArray = Array.isArray(rawExisting)
        ? rawExisting
        : String(rawExisting)
            .split(',')
            .map((f) => f.trim())
            .filter(Boolean);
    }

    const newFilePaths = this.saveFiles(files);
    
    const filePaths = [...existingFilesArray, ...newFilePaths];

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...rest,
        files: JSON.stringify(filePaths),
        due_date: due_date ? new Date(due_date) : null,
        project: {
          connect: { id: project.id },
        },
        assignees: {
          deleteMany: {},
          create: normalizedAssigneeIds.map((userId) => ({
            user: {
              connect: { id: userId },
            },
          })),
        },
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapTask(task);
  }

  async remove(id: number) {
    return this.prisma.task.delete({ where: { id } });
  }
}
