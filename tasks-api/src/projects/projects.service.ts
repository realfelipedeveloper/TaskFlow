import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  private normalizeName(name?: string) {
    return name?.trim() || '';
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Ja existe um projeto com esse nome.');
    }

    throw error;
  }

  async findAll() {
    return this.prisma.project.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });
  }

  async findSelect() {
    return this.prisma.project.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: { name: string; description?: string | null }) {
    const name = this.normalizeName(data.name);

    if (!name) {
      throw new BadRequestException('O nome do projeto e obrigatorio.');
    }

    try {
      return await this.prisma.project.create({
        data: {
          name,
          description: data.description?.trim() || null,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: number, data: { name?: string; description?: string | null }) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Projeto nao encontrado.');
    }

    const name = data.name !== undefined ? this.normalizeName(data.name) : undefined;

    if (data.name !== undefined && !name) {
      throw new BadRequestException('O nome do projeto e obrigatorio.');
    }

    try {
      return await this.prisma.project.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(data.description !== undefined
            ? { description: data.description?.trim() || null }
            : {}),
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Projeto nao encontrado.');
    }

    if (project._count.tasks > 0) {
      throw new BadRequestException(
        'Nao e possivel excluir um projeto com tarefas vinculadas.',
      );
    }

    return this.prisma.project.delete({
      where: { id },
    });
  }
}
