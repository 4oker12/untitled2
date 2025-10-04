import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class MessagesService {
    constructor(private readonly prisma: PrismaService) {}

    private async assertFriends(a: string, b: string) {
        if (a === b) throw new ForbiddenException('Cannot message yourself');
        const fr = await this.prisma.friendRequest.findFirst({
            where: { status: 'ACCEPTED', OR: [{ fromId: a, toId: b }, { fromId: b, toId: a }] },
        });
        if (!fr) throw new ForbiddenException('Users are not friends');
    }

    async send(fromId: string, toUserId: string, body: string) {
        await this.assertFriends(fromId, toUserId);
        return this.prisma.message.create({ data: { fromUserId: fromId, toUserId, body } });
    }

    async list(meId: string, withUserId: string, take = 20, cursor?: string) {
        await this.assertFriends(meId, withUserId);
        return this.prisma.message.findMany({
            where: {
                OR: [
                    { fromUserId: meId, toUserId: withUserId },
                    { fromUserId: withUserId, toUserId: meId },
                ],
            },
            orderBy: { createdAt: 'desc' },
            take,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        });
    }

    async markRead(meId: string, id: string) {
        const msg = await this.prisma.message.findUnique({ where: { id } });
        if (!msg) throw new NotFoundException('Message not found');
        if (msg.toUserId !== meId) throw new ForbiddenException('Only recipient can mark read');
        return this.prisma.message.update({ where: { id }, data: { readAt: new Date() } });
    }

    // внутри export class MessagesService { ... }

    async unreadTotal(userId: string) {
        return this.prisma.message.count({
            where: { toUserId: userId, readAt: null },
        });
    }

    async unreadByUser(userId: string) {
        const rows = await this.prisma.message.groupBy({
            by: ['fromUserId'],
            where: { toUserId: userId, readAt: null },
            _count: { _all: true },
        });
        return rows.map(r => ({ userId: r.fromUserId, count: r._count._all }));
    }

    async unreadSummary(userId: string) {
        const [total, byUser] = await Promise.all([
            this.unreadTotal(userId),
            this.unreadByUser(userId),
        ]);
        return { total, byUser };
    }

}
