// [NEW] app/backend/src/modules/friends/friends.service.ts
import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js'; // <- у тебя уже должен быть PrismaService
import { UsersService } from '../users/users.service.js';       // <- используем для поиска юзеров (handle/id)
import { AuthService } from '../auth/auth.service.js';
import {
    CreateFriendRequestDto,
    FriendRequestDto,
    FriendRequestStatus,
    PublicUserDto,
} from './friends.dto.js';

@Injectable()
export class FriendsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly users: UsersService,
        private readonly auth: AuthService,
    ) {}

    // ----- helpers -----
    private bearerOrCookie(req: Request): string | null {
        const h = req.header('authorization') ?? '';
        const bearer = h.startsWith('Bearer ') ? h.slice(7).trim() : null;
        const cookie = (req as any).cookies?.['access_token'] as string | undefined;
        return bearer || cookie || null;
    }

    private async requireCurrentUser(req: Request): Promise<PublicUserDto> {
        const token = this.bearerOrCookie(req);
        if (!token) throw new ForbiddenException('Unauthorized');
        const payload = this.auth.verifyAccessToken(token);
        const u = await this.users.findById(payload.sub);
        if (!u) throw new ForbiddenException('Unauthorized');
        return {
            id: String(u.id),
            email: u.email,
            name: u.name ?? null,
            role: (u.role ?? 'USER') as any,
            handle: (u as any).handle ?? null,
        };
    }

    private toUserDto(u: any): PublicUserDto {
        return {
            id: String(u.id),
            email: u.email,
            name: u.name ?? null,
            role: (u.role ?? 'USER') as any,
            handle: (u.handle ?? null) as any,
        };
    }

    private async hydrateReq(r: any): Promise<FriendRequestDto> {
        const [fromU, toU] = await Promise.all([
            this.users.findById(r.fromUserId),
            this.users.findById(r.toUserId),
        ]);
        return {
            id: r.id,
            from: fromU ? this.toUserDto(fromU) : null,
            to: toU ? this.toUserDto(toU) : null,
            status: r.status,
            createdAt: (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt)).toISOString(),
            updatedAt: (r.updatedAt instanceof Date ? r.updatedAt : new Date(r.updatedAt)).toISOString(),
        };
    }

    private pairKey(a: string, b: string) {
        const [x, y] = [String(a), String(b)].sort();
        return `${x}|${y}`;
    }

    private async areFriends(a: string, b: string): Promise<boolean> {
        const key = this.pairKey(a, b);
        const found = await this.prisma.friendship.findUnique({ where: { pairKey: key } });
        return Boolean(found);
    }

    private async addFriendship(a: string, b: string) {
        const key = this.pairKey(a, b);
        await this.prisma.friendship.upsert({
            where: { pairKey: key },
            update: {},
            create: { pairKey: key, userIdA: a, userIdB: b },
        });
    }

    private async removeFriendship(a: string, b: string) {
        const key = this.pairKey(a, b);
        await this.prisma.friendship.deleteMany({ where: { pairKey: key } });
    }

    // ----- public API -----

    async listFriends(req: Request): Promise<PublicUserDto[]> {
        const me = await this.requireCurrentUser(req);
        const rows = await this.prisma.friendship.findMany({
            where: { OR: [{ userIdA: me.id }, { userIdB: me.id }] },
        });
        const ids = rows.map(r => (r.userIdA === me.id ? r.userIdB : r.userIdA));
        const users = await this.prisma.user.findMany({
            where: { id: { in: ids } },
            select: { id: true, email: true, name: true, role: true, handle: true },
        });
        return users.map(this.toUserDto);
    }

    async listRequests(req: Request, type?: 'incoming' | 'outgoing'): Promise<FriendRequestDto[]> {
        const me = await this.requireCurrentUser(req);
        const where: any = {};
        if (type === 'incoming') where.toUserId = me.id;
        if (type === 'outgoing') where.fromUserId = me.id;

        const rows = await this.prisma.friendRequest.findMany({
            where,
            orderBy: { createdAt: 'asc' },
        });
        return Promise.all(rows.map(r => this.hydrateReq(r)));
    }

    async createRequest(req: Request, body: CreateFriendRequestDto): Promise<FriendRequestDto> {
        const me = await this.requireCurrentUser(req);
        const toHandle = (body?.toHandle ?? '').trim();
        if (!toHandle) throw new BadRequestException('toHandle is required');
        if (toHandle.length < 3) throw new BadRequestException('toHandle must be longer than or equal to 3 characters');

        const target = await this.prisma.user.findUnique({ where: { handle: toHandle } });
        if (!target) throw new NotFoundException('User with such handle not found');

        if (String(target.id) === String(me.id)) {
            throw new BadRequestException('Cannot send a friend request to yourself');
        }

        if (await this.areFriends(me.id, target.id)) {
            throw new BadRequestException('Already friends');
        }

        const existingOutgoing = await this.prisma.friendRequest.findFirst({
            where: { fromUserId: me.id, toUserId: target.id, status: 'PENDING' },
        });
        if (existingOutgoing) throw new BadRequestException('Request already exists');

        // зеркальная входящая → auto-accept
        const mirrored = await this.prisma.friendRequest.findFirst({
            where: { fromUserId: target.id, toUserId: me.id, status: 'PENDING' },
        });
        if (mirrored) {
            const updated = await this.prisma.$transaction(async (tx) => {
                const fr = await tx.friendRequest.update({
                    where: { id: mirrored.id },
                    data: { status: 'ACCEPTED' },
                });
                await this.addFriendship(me.id, target.id);
                return fr;
            });
            return this.hydrateReq(updated);
        }

        const created = await this.prisma.friendRequest.create({
            data: {
                fromUserId: me.id,
                toUserId: target.id,
                status: 'PENDING',
            },
        });
        return this.hydrateReq(created);
    }

    async accept(req: Request, id: string): Promise<FriendRequestDto> {
        const me = await this.requireCurrentUser(req);
        const fr = await this.prisma.friendRequest.findUnique({ where: { id } });
        if (!fr) throw new NotFoundException('Request not found');
        if (String(fr.toUserId) !== String(me.id)) throw new ForbiddenException('Only recipient can accept');
        if (fr.status !== 'PENDING') throw new BadRequestException('Request is not pending');

        const updated = await this.prisma.$transaction(async (tx) => {
            const u = await tx.friendRequest.update({
                where: { id },
                data: { status: 'ACCEPTED' },
            });
            await this.addFriendship(fr.fromUserId, fr.toUserId);
            return u;
        });
        return this.hydrateReq(updated);
    }

    async decline(req: Request, id: string): Promise<FriendRequestDto> {
        const me = await this.requireCurrentUser(req);
        const fr = await this.prisma.friendRequest.findUnique({ where: { id } });
        if (!fr) throw new NotFoundException('Request not found');
        if (String(fr.toUserId) !== String(me.id)) throw new ForbiddenException('Only recipient can decline');
        if (fr.status !== 'PENDING') throw new BadRequestException('Request is not pending');

        const updated = await this.prisma.friendRequest.update({
            where: { id },
            data: { status: 'DECLINED' },
        });
        return this.hydrateReq(updated);
    }

    async cancel(req: Request, id: string): Promise<FriendRequestDto> {
        const me = await this.requireCurrentUser(req);
        const fr = await this.prisma.friendRequest.findUnique({ where: { id } });
        if (!fr) throw new NotFoundException('Request not found');
        if (String(fr.fromUserId) !== String(me.id)) throw new ForbiddenException('Only author can cancel');
        if (fr.status !== 'PENDING') throw new BadRequestException('Request is not pending');

        const updated = await this.prisma.friendRequest.update({
            where: { id },
            data: { status: 'CANCELED' },
        });
        return this.hydrateReq(updated);
    }

    async removeFriend(req: Request, userId: string): Promise<{ data: boolean }> {
        const me = await this.requireCurrentUser(req);
        await this.removeFriendship(me.id, String(userId));
        return { data: true };
    }

    async searchUsers(q: string): Promise<PublicUserDto[]> {
        const query = (q ?? '').trim();
        if (!query) return [];
        const users = await this.prisma.user.findMany({
            where: {
                OR: [
                    { handle: { contains: query, mode: 'insensitive' } },
                    { email:  { contains: query, mode: 'insensitive' } },
                    { id:     { contains: query } },
                ],
            },
            take: 20,
            select: { id: true, email: true, name: true, role: true, handle: true },
        });
        return users.map(this.toUserDto);
    }
}
