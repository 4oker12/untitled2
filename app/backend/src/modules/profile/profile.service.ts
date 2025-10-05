// app/backend/src/modules/profile/profile.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ProfileService {
    constructor(private readonly prisma: PrismaService) {}

    getById(userId: string) {
        return this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    }

    update(userId: string, data: { name?: string; handle?: string }) {
        return this.prisma.user.update({
            where: { id: userId },
            data,
        });
    }
}
