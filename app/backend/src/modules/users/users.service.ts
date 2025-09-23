// src/modules/users/users.service.ts
// Service = бизнес-логика + доступ к данным. Здесь мы используем PrismaClient и возвращаем сущности БД.

import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

type Role = 'ADMIN' | 'USER';

@Injectable()
export class UsersService {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findByHandle(handle: string) {
    const norm = handle.trim().toLowerCase(); // [ADDED] нормализация
    return prisma.user.findUnique({ where: { handle: norm } });
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async list() {
    return prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async searchByHandle(q: string) {
    const qq = q.trim().toLowerCase();
    if (!qq || qq.length < 2) return [];
    return prisma.user.findMany({
      where: { handle: { contains: qq } },
      take: 20,
      orderBy: { handle: 'asc' },
    });
  }

  async create(data: {
    email: string;
    password: string;            // сырой пароль — хешируем здесь
    name?: string | null;
    role?: Role;
    handle?: string | null;
  }) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    const normHandle = data.handle ? data.handle.trim().toLowerCase() : null;

    try {
      return await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name ?? null,
          role: (data.role ?? 'USER') as Role,
          handle: normHandle,
          // id/createdAt/updatedAt генерятся автоматически по schema.prisma
        },
      });
    } catch (e: any) {
      // [ADDED] аккуратная обработка уникальных ограничений (email/handle)
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const target = Array.isArray((e as any).meta?.target) ? (e as any).meta.target : [];
        if (target.includes('email')) throw new ConflictException('EMAIL_TAKEN');
        if (target.includes('handle')) throw new ConflictException('HANDLE_TAKEN');
        throw new ConflictException('UNIQUE_CONSTRAINT_VIOLATION');
      }
      throw e;
    }
  }

  async update(id: string, data: { name?: string | null; role?: Role; handle?: string | null }) {
    const normHandle = data.handle ? data.handle.trim().toLowerCase() : undefined;
    try {
      return await prisma.user.update({
        where: { id },
        data: {
          name: data.name ?? undefined,
          role: (data.role as Role) ?? undefined,
          handle: normHandle,
        },
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const target = Array.isArray((e as any).meta?.target) ? (e as any).meta.target : [];
        if (target.includes('handle')) throw new ConflictException('HANDLE_TAKEN');
        throw new ConflictException('UNIQUE_CONSTRAINT_VIOLATION');
      }
      throw e;
    }
  }
}

