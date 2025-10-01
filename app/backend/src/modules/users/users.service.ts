import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import bcrypt from 'bcrypt';
import { CreateUserDto, UpdateUserDto } from './users.dto.js';

type Role = 'ADMIN' | 'USER';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async searchByHandle(q: string) {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    // CHANGED: без mode, ищем по нормализованному handle
    return this.prisma.user.findMany({
      where: { handle: { contains: query } }, // CHANGED
      orderBy: { handle: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    // CHANGED: нормализуем email, чтобы уникальность работала независимо от регистра
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } }); // CHANGED
  }

  async findByHandle(handle: string) {
    return this.prisma.user.findUnique({ where: { handle: handle.toLowerCase() } }); // CHANGED
  }

  async create(data: CreateUserDto) {
    const normHandle = data.handle?.toLowerCase() ?? null; // CHANGED
    const normEmail  = data.email.toLowerCase();           // CHANGED

    if (normHandle) {
      const existingHandle = await this.findByHandle(normHandle);
      if (existingHandle) throw new ConflictException('HANDLE_TAKEN');
    }
    const existingEmail = await this.findByEmail(normEmail);
    if (existingEmail) throw new ConflictException('EMAIL_TAKEN');

    const passwordHash = await bcrypt.hash(data.password, 12);
    try {
      return await this.prisma.user.create({
        data: {
          email: normEmail,                              // CHANGED
          passwordHash,
          name: data.name ?? null,
          role: (data.role ?? 'USER') as Role,
          handle: normHandle,                            // CHANGED
        },
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('UNIQUE_CONSTRAINT_VIOLATION');
      }
      throw e;
    }
  }

  async update(id: string, data: UpdateUserDto) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    const patch: any = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.role !== undefined) patch.role = data.role;
    if (data.handle !== undefined) {
      patch.handle = data.handle ? data.handle.toLowerCase() : null; // CHANGED
    }

    try {
      return await this.prisma.user.update({ where: { id }, data: patch });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('UNIQUE_CONSTRAINT_VIOLATION');
      }
      throw e;
    }
  }
}
