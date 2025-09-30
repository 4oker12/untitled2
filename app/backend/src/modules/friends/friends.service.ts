// app/backend/src/modules/friends/friends.service.ts
import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthService } from '../auth/auth.service.js';
import {
    CreateFriendRequestDto,
    FriendRequestDto,
    PublicUserDto,
} from './friends.dto.js';

@Injectable()
export class FriendsService {
    constructor(
        private readonly prisma: PrismaService, // <-- вместо new PrismaClient()
        private readonly auth: AuthService,
    ) {}

    // --- helpers ---
    private bearerOrCookie(req: Request): string | null {
        const h = req.header('authorization') ?? '';
        const bearer = h.startsWith('Bearer ') ? h.slice(7).trim() : null;
        const cookie = (req as any).cookies?.['access_token'] as string | undefined;
        return bearer || cookie || null;
    }

    private async requireMe(req: Request) {
        const token = this.bearerOrCookie(req);
        if (!token) throw new ForbiddenException('Unauthorized');
        const payload = this.auth.verifyAccessToken(token);
        if (!payload?.sub) throw new ForbiddenException('Unauthorized');
        const me = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!me) throw new ForbiddenException('Unauthorized');
        return me;
    }

    private toUserDto(u: any): PublicUserDto {
        return {
            id: String(u.id),
            email: u.email ?? null,
            name: u.name ?? null,
            role: u.role ?? 'USER',
            handle: u.handle ?? null,
        };
    }

    private async hydrate(r: any): Promise<FriendRequestDto> {
        const [from, to] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: r.fromId } }),
            this.prisma.user.findUnique({ where: { id: r.toId } }),
        ]);
        return {
            id: r.id,
            from: from ? this.toUserDto(from) : null,
            to: to ? this.toUserDto(to) : null,
            status: r.status,
            createdAt: (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt)).toISOString(),
            updatedAt: (r.updatedAt instanceof Date ? r.updatedAt : new Date(r.updatedAt)).toISOString(),
        };
    }

    // --- public API ---
    async listFriends(req: Request) {
        const me = await this.requireMe(req);

        const accepted = await this.prisma.friendRequest.findMany({
            where: {
                status: 'ACCEPTED',
                OR: [{ fromId: me.id }, { toId: me.id }],
            },
            select: { fromId: true, toId: true },
            orderBy: { createdAt: 'asc' },
        });

        const otherIds = Array.from(new Set(accepted.map(r => (r.fromId === me.id ? r.toId : r.fromId))));
        if (otherIds.length === 0) return { data: [] };

        const users = await this.prisma.user.findMany({
            where: { id: { in: otherIds } },
            select: { id: true, email: true, name: true, role: true, handle: true },
        });
        return { data: users.map(u => this.toUserDto(u)) };
    }

    async listRequests(req: Request, type?: 'incoming'|'outgoing') {
        const me = await this.requireMe(req);
        const where: any = {};
        if (type === 'incoming') where.toId = me.id;
        if (type === 'outgoing') where.fromId = me.id;

        const rows = await this.prisma.friendRequest.findMany({
            where,
            orderBy: { createdAt: 'asc' },
        });
        const data = await Promise.all(rows.map(r => this.hydrate(r)));
        return { data };
    }

    async createRequest(req: Request, body: CreateFriendRequestDto) {
        const me = await this.requireMe(req);
        const toHandle = (body?.toHandle ?? '').trim();
        if (!toHandle) throw new BadRequestException('toHandle is required');
        if (toHandle.length < 3) throw new BadRequestException('toHandle must be longer than or equal to 3 characters');

        const target = await this.prisma.user.findUnique({ where: { handle: toHandle } });
        if (!target) throw new NotFoundException('User with such handle not found');
        if (target.id === me.id) throw new BadRequestException('Cannot send a friend request to yourself');

        const already = await this.prisma.friendRequest.findFirst({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { fromId: me.id, toId: target.id },
                    { fromId: target.id, toId: me.id },
                ],
            },
        });
        if (already) throw new BadRequestException('Already friends');

        const outgoing = await this.prisma.friendRequest.findFirst({
            where: { fromId: me.id, toId: target.id, status: 'PENDING' },
        });
        if (outgoing) throw new BadRequestException('Request already exists');

        const mirrored = await this.prisma.friendRequest.findFirst({
            where: { fromId: target.id, toId: me.id, status: 'PENDING' },
        });
        if (mirrored) {
            const updated = await this.prisma.friendRequest.update({
                where: { id: mirrored.id },
                data: { status: 'ACCEPTED' },
            });
            return { data: await this.hydrate(updated) };
        }

        const created = await this.prisma.friendRequest.create({
            data: { fromId: me.id, toId: target.id, status: 'PENDING' },
        });
        return { data: await this.hydrate(created) };
    }

    async accept(req: Request, id: string) {
        const me = await this.requireMe(req);
        const fr = await this.prisma.friendRequest.findUnique({ where: { id } });
        if (!fr) throw new NotFoundException('Request not found');
        if (fr.toId !== me.id) throw new ForbiddenException('Only recipient can accept');
        if (fr.status !== 'PENDING') throw new BadRequestException('Request is not pending');

        const updated = await this.prisma.friendRequest.update({
            where: { id },
            data: { status: 'ACCEPTED' },
        });
        return { data: await this.hydrate(updated) };
    }

    async decline(req: Request, id: string) {
        const me = await this.requireMe(req);
        const fr = await this.prisma.friendRequest.findUnique({ where: { id } });
        if (!fr) throw new NotFoundException('Request not found');
        if (fr.toId !== me.id) throw new ForbiddenException('Only recipient can decline');
        if (fr.status !== 'PENDING') throw new BadRequestException('Request is not pending');

        const updated = await this.prisma.friendRequest.update({
            where: { id },
            data: { status: 'DECLINED' },
        });
        return { data: await this.hydrate(updated) };
    }

    async cancel(req: Request, id: string) {
        const me = await this.requireMe(req);
        const fr = await this.prisma.friendRequest.findUnique({ where: { id } });
        if (!fr) throw new NotFoundException('Request not found');
        if (fr.fromId !== me.id) throw new ForbiddenException('Only author can cancel');
        if (fr.status !== 'PENDING') throw new BadRequestException('Request is not pending');

        const updated = await this.prisma.friendRequest.update({
            where: { id },
            data: { status: 'CANCELED' },
        });
        return { data: await this.hydrate(updated) };
    }

    async removeFriend(req: Request, userId: string) {
        const me = await this.requireMe(req);
        await this.prisma.friendRequest.deleteMany({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { fromId: me.id, toId: userId },
                    { fromId: userId, toId: me.id },
                ],
            },
        });
        return { data: true };
    }

    // (опционально, если у тебя есть роут /friends/search/users)
    async searchUsers(q: string) {
        const query = (q ?? '').trim();
        if (!query) return { data: [] };

        const users = await this.prisma.user.findMany({
            where: {
                OR: [
                    { handle: { contains: query, mode: 'insensitive' } as any },
                    { email:  { contains: query, mode: 'insensitive' } as any },
                    { id:     { contains: query } as any },
                ],
            },
            take: 20,
            select: { id: true, email: true, name: true, role: true, handle: true },
        });
        return { data: users.map(u => this.toUserDto(u)) };
    }
}
