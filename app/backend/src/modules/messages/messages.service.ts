// src/modules/messages/messages.service.ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class MessagesService {
    constructor(private readonly prisma: PrismaService) {}

    async list(meId: string, otherId: string) {
        // можете добавить проверки существования otherId при желании
        return this.prisma.message.findMany({
            where: {
                OR: [
                    { fromUserId: meId, toUserId: otherId },
                    { fromUserId: otherId, toUserId: meId },
                ],
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async send(meId: string, toUserId: string, body: string) {
        if (!body?.trim()) throw new ForbiddenException('Empty message');
        const toUser = await this.prisma.user.findUnique({ where: { id: toUserId } });
        if (!toUser) throw new NotFoundException('Recipient not found');

        return this.prisma.message.create({
            data: {
                fromUserId: meId,
                toUserId,
                body,
            },
        });
    }
}
