import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class MessagesService {
    constructor(private readonly prisma: PrismaService) {}

    private async resolveUser(target: string) {
        const byId = await this.prisma.user.findUnique({ where: { id: target } });
        if (byId) return byId;
        const byHandle = await this.prisma.user.findUnique({ where: { handle: target } });
        if (byHandle) return byHandle;
        throw new NotFoundException('User not found');
    }

    async send(fromUserId: string, to: string, body: string) {
        const target = await this.resolveUser(to);
        if (target.id === fromUserId) throw new ForbiddenException('Cannot send message to yourself');

        // relation create через connect — не зависит от названий FK-полей в схеме
        return this.prisma.message.create({
            data: {
                body,
                from: { connect: { id: fromUserId } },
                to:   { connect: { id: target.id } },
            },
            include: { from: true, to: true },
        });
    }

    async list(userId: string, peer?: string, cursor?: string, take = 20) {
        take = Math.max(1, Math.min(100, take ?? 20));

        let peerId: string | undefined;
        if (peer) peerId = (await this.resolveUser(peer)).id;

        const where = peerId
            ? {
                OR: [
                    { from: { id: userId }, to: { id: peerId } },
                    { from: { id: peerId }, to: { id: userId } },
                ],
            }
            : { OR: [{ from: { id: userId } }, { to: { id: userId } }] };

        const items = await this.prisma.message.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: take + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: { from: true, to: true },
        });

        const nextCursor = items.length > take ? items[take].id : undefined;
        return { items: items.slice(0, take), nextCursor };
    }

    async markRead(userId: string, ids: string[]) {
        const res = await this.prisma.message.updateMany({
            where: { id: { in: ids }, to: { id: userId }, readAt: null },
            data: { readAt: new Date() },
        });
        return { count: res.count };
    }

    async unreadCount(userId: string) {
        const count = await this.prisma.message.count({
            where: { to: { id: userId }, readAt: null },
        });
        return { count };
    }

    async unreadCountWith(userId: string, peer: string) {
        const peerId = (await this.resolveUser(peer)).id;
        const count = await this.prisma.message.count({
            where: { to: { id: userId }, from: { id: peerId }, readAt: null },
        });
        return { count };
    }

    /** peers: список собеседников с lastMessage и unreadCount; пагинация по peer userId */
    async peers(userId: string, q?: string, cursor?: string, take = 20) {
        take = Math.max(1, Math.min(100, take ?? 20));

        // Берём последние сообщения (буфер) и строим уникальный список собеседников
        const recent = await this.prisma.message.findMany({
            where: { OR: [{ from: { id: userId } }, { to: { id: userId } }] },
            orderBy: { createdAt: 'desc' },
            take: 300,
            include: { from: true, to: true },
        });

        const order: string[] = [];
        const lastByPeer = new Map<string, any>();
        for (const m of recent) {
            const peerId = m.from.id === userId ? m.to.id : m.from.id;
            if (!lastByPeer.has(peerId)) {
                lastByPeer.set(peerId, m);
                order.push(peerId);
            }
        }

        const users = await this.prisma.user.findMany({
            where: { id: { in: order } },
            select: { id: true, handle: true, name: true },
        });
        const usersById = new Map(users.map(u => [u.id, u]));

        const unreadRows = await this.prisma.message.findMany({
            where: { to: { id: userId }, readAt: null, from: { id: { in: order } } },
            select: { from: { select: { id: true } } },
        });
        const unreadByPeer = new Map<string, number>();
        for (const row of unreadRows) {
            const pid = row.from.id;
            unreadByPeer.set(pid, (unreadByPeer.get(pid) ?? 0) + 1);
        }

        const filtered = order.filter(pid => {
            const u = usersById.get(pid);
            if (!u) return false;
            if (!q) return true;
            const needle = q.toLowerCase();
            return (u.handle ?? '').toLowerCase().includes(needle) || (u.name ?? '').toLowerCase().includes(needle);
        });

        const startIndex = cursor ? filtered.indexOf(cursor) + 1 : 0;
        const pageIds = filtered.slice(startIndex, startIndex + take);
        const nextCursor = filtered.length > startIndex + take ? filtered[startIndex + take - 1] : undefined;

        const items = pageIds.map(pid => {
            const u = usersById.get(pid)!;
            const last = lastByPeer.get(pid) ?? null;
            const unread = unreadByPeer.get(pid) ?? 0;
            return { user: u, lastMessage: last, unreadCount: unread };
        });

        return { items, nextCursor };
    }
    /** Суммарка непрочитанных: всего + по каждому собеседнику */
    async unreadSummary(userId: string) {
        const rows = await this.prisma.message.findMany({
            where: { to: { id: userId }, readAt: null },
            select: { from: { select: { id: true, handle: true, name: true } } },
        });

        const byId = new Map<string, { user: { id: string; handle: string | null; name: string | null }; count: number }>();
        for (const r of rows) {
            const u = r.from;
            const prev = byId.get(u.id)?.count ?? 0;
            byId.set(u.id, { user: { id: u.id, handle: u.handle ?? null, name: u.name ?? null }, count: prev + 1 });
        }

        const peers = Array.from(byId.values()).sort((a, b) => b.count - a.count);
        return { total: rows.length, peers };
    }

}
