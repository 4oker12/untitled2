// src/modules/friends/friends.service.ts
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateFriendRequestDto, FriendRequestDto, FriendRequestStatus, PublicUserDto } from './friends.dto.js';

@Injectable()
export class FriendsService {
    constructor(private readonly prisma: PrismaService) {}

    async list(userId: string): Promise<PublicUserDto[]> {
        const users = await this.prisma.user.findMany({
            where: { id: { not: userId } },
            select: { id: true, email: true, name: true, handle: true },
        });
        return users.map(u => ({
            id: String(u.id),
            email: u.email ?? null,
            name: u.name ?? null,
            handle: u.handle ?? null,
        }));
    }

    async listRequests(userId: string, type?: 'incoming' | 'outgoing'): Promise<FriendRequestDto[]> {
        const where =
            type === 'incoming'
                ? { toId: userId }
                : type === 'outgoing'
                    ? { fromId: userId }
                    : { OR: [{ fromId: userId }, { toId: userId }] };

        const reqs = await this.prisma.friendRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        return reqs.map(r => ({
            id: r.id,
            from: { id: r.fromId } as PublicUserDto,
            to:   { id: r.toId }   as PublicUserDto,
            status: r.status as FriendRequestStatus,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
        }));
    }

    async createRequest(userId: string, dto: CreateFriendRequestDto): Promise<FriendRequestDto> {
        const handle = dto.toHandle?.trim().toLowerCase();
        if (!handle) throw new BadRequestException('toHandle is required');

        const to = await this.prisma.user.findUnique({ where: { handle } });
        if (!to) throw new NotFoundException('User not found');
        if (to.id === userId) throw new BadRequestException('Cannot send request to yourself');

        // не дублируем заявку
        const exists = await this.prisma.friendRequest.findFirst({
            where: { fromId: userId, toId: to.id },
        });
        if (exists) {
            return {
                id: exists.id,
                from: { id: exists.fromId } as PublicUserDto,
                to:   { id: exists.toId }   as PublicUserDto,
                status: exists.status as FriendRequestStatus,
                createdAt: exists.createdAt.toISOString(),
                updatedAt: exists.updatedAt.toISOString(),
            };
        }

        const created = await this.prisma.friendRequest.create({
            data: { fromId: userId, toId: to.id, status: 'PENDING' },
        });
        return {
            id: created.id,
            from: { id: created.fromId } as PublicUserDto,
            to:   { id: created.toId }   as PublicUserDto,
            status: created.status as FriendRequestStatus,
            createdAt: created.createdAt.toISOString(),
            updatedAt: created.updatedAt.toISOString(),
        };
    }

    async accept(userId: string, id: string): Promise<FriendRequestDto> {
        const fr = await this.prisma.friendRequest.findUnique({ where: { id } });
        if (!fr) throw new NotFoundException('Request not found');
        if (fr.toId !== userId) throw new ForbiddenException();

        const updated = await this.prisma.friendRequest.update({ where: { id }, data: { status: 'ACCEPTED' } });
        return {
            id: updated.id,
            from: { id: updated.fromId } as PublicUserDto,
            to:   { id: updated.toId }   as PublicUserDto,
            status: updated.status as FriendRequestStatus,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
        };
    }

    async decline(userId: string, id: string): Promise<FriendRequestDto> {
        const fr = await this.prisma.friendRequest.findUnique({ where: { id } });
        if (!fr) throw new NotFoundException('Request not found');
        if (fr.toId !== userId) throw new ForbiddenException();

        const updated = await this.prisma.friendRequest.update({ where: { id }, data: { status: 'DECLINED' } });
        return {
            id: updated.id,
            from: { id: updated.fromId } as PublicUserDto,
            to:   { id: updated.toId }   as PublicUserDto,
            status: updated.status as FriendRequestStatus,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
        };
    }

    async cancel(userId: string, id: string): Promise<FriendRequestDto> {
        const fr = await this.prisma.friendRequest.findUnique({ where: { id } });
        if (!fr) throw new NotFoundException('Request not found');
        if (fr.fromId !== userId) throw new ForbiddenException();

        const removed = await this.prisma.friendRequest.delete({ where: { id } });
        return {
            id: removed.id,
            from: { id: removed.fromId } as PublicUserDto,
            to:   { id: removed.toId }   as PublicUserDto,
            status: removed.status as FriendRequestStatus,
            createdAt: removed.createdAt.toISOString(),
            updatedAt: removed.updatedAt.toISOString(),
        };
    }
}
