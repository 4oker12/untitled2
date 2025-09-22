// src/modules/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// тип enum'а берем из Prisma.$Enums
type Role = 'ADMIN' | 'USER';

@Injectable()
export class UsersService {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async list() {
    return prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    name?: string | null;
    role?: Role;
  }) {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name ?? null,
        // если у тебя есть runtime-константа Prisma.Role — можно так:
        // role: data.role ?? Prisma.Role.USER,
        // кросс-версионно безопасно — так:
        role: (data.role ?? 'USER') as Role,
      },
    });
  }
}
