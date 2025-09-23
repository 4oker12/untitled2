import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaClient, $Enums } from '@prisma/client'; // [ADDED] $Enums для типобезопасных статусов

const prisma = new PrismaClient();

@Injectable()
export class FriendsService {
    /**
     * Отправить заявку по никнейму (handle).
     * - нормализуем handle в lowercase
     * - запрещаем self-request
     * - если есть встречная PENDING → авто-ACCEPT
     * - запрещаем дубли
     */
    async sendRequest(currentUserId: string, toHandle: string) {
        const norm = toHandle.trim().toLowerCase(); // [ADDED] нормализация
        const to = await prisma.user.findUnique({ where: { handle: norm } });
        if (!to) throw new NotFoundException('User not found');
        if (to.id === currentUserId) throw new BadRequestException('Cannot friend yourself');

        // уже друзья?
        const already = await prisma.friendRequest.findFirst({
            where: {
                status: $Enums.FriendRequestStatus.ACCEPTED, // [CHANGED] enum вместо строки
                OR: [
                    { fromId: currentUserId, toId: to.id },
                    { fromId: to.id, toId: currentUserId },
                ],
            },
        });
        if (already) throw new BadRequestException('Already friends');

        // исходящая заявка уже есть?
        const existing = await prisma.friendRequest.findUnique({
            where: { fromId_toId: { fromId: currentUserId, toId: to.id } },
        });
        if (existing) throw new BadRequestException('Request already exists');

        // встречная заявка? → auto-accept
        const reverse = await prisma.friendRequest.findUnique({
            where: { fromId_toId: { fromId: to.id, toId: currentUserId } },
        });
        if (reverse && reverse.status === $Enums.FriendRequestStatus.PENDING) { // [CHANGED]
            const accepted = await prisma.friendRequest.update({
                where: { id: reverse.id },
                data: { status: $Enums.FriendRequestStatus.ACCEPTED }, // [CHANGED] enum
                include: { from: true, to: true },
            });
            return accepted;
        }

        // создать новую PENDING
        return prisma.friendRequest.create({
            data: {
                fromId: currentUserId,
                toId: to.id,
                status: $Enums.FriendRequestStatus.PENDING, // [CHANGED]
            },
            include: { from: true, to: true },
        });
    }

    /**
     * Принять входящую заявку
     */
    async acceptRequest(currentUserId: string, requestId: string) {
        const fr = await prisma.friendRequest.findUnique({ where: { id: requestId } });
        if (!fr) throw new NotFoundException('Request not found');
        if (fr.toId !== currentUserId) throw new ForbiddenException('Not your incoming request');
        if (fr.status !== $Enums.FriendRequestStatus.PENDING) { // [CHANGED]
            throw new BadRequestException('Request is not pending');
        }

        return prisma.friendRequest.update({
            where: { id: requestId },
            data: { status: $Enums.FriendRequestStatus.ACCEPTED }, // [CHANGED]
            include: { from: true, to: true },
        });
    }

    /**
     * Отклонить входящую заявку
     */
    async declineRequest(currentUserId: string, requestId: string) {
        const fr = await prisma.friendRequest.findUnique({ where: { id: requestId } });
        if (!fr) throw new NotFoundException('Request not found');
        if (fr.toId !== currentUserId) throw new ForbiddenException('Not your incoming request');
        if (fr.status !== $Enums.FriendRequestStatus.PENDING) { // [ADDED]
            throw new BadRequestException('Request is not pending');
        }

        return prisma.friendRequest.update({
            where: { id: requestId },
            data: { status: $Enums.FriendRequestStatus.DECLINED }, // [CHANGED] было 'DECLINED' строкой; теперь enum
            include: { from: true, to: true },
        });
    }

    /**
     * Отменить свою исходящую заявку (cancel)
     * В твоей схеме нет статуса CANCELED, поэтому используем DECLINED.
     */
    async cancelRequest(currentUserId: string, requestId: string) {
        const fr = await prisma.friendRequest.findUnique({ where: { id: requestId } });
        if (!fr) throw new NotFoundException('Request not found');
        if (fr.fromId !== currentUserId) throw new ForbiddenException('Not your outgoing request');
        if (fr.status !== $Enums.FriendRequestStatus.PENDING) { // [ADDED]
            throw new BadRequestException('Request is not pending');
        }

        return prisma.friendRequest.update({
            where: { id: requestId },
            data: { status: $Enums.FriendRequestStatus.DECLINED }, // [FIX] было 'CANCELED' → enum DECLINED
            include: { from: true, to: true },
        });
    }

    /**
     * Удалить друга.
     * Так как FRIENDSHIP отдельной таблицы нет, дружба = запись со статусом ACCEPTED.
     * Для "удаления" друга переводим её в DECLINED (или можно удалить запись — выбрал DECLINED для истории).
     */
    async removeFriend(currentUserId: string, friendUserId: string) {
        const accepted = await prisma.friendRequest.findFirst({
            where: {
                status: $Enums.FriendRequestStatus.ACCEPTED, // [CHANGED]
                OR: [
                    { fromId: currentUserId, toId: friendUserId },
                    { fromId: friendUserId, toId: currentUserId },
                ],
            },
        });
        if (!accepted) throw new NotFoundException('Not friends');

        return prisma.friendRequest.update({
            where: { id: accepted.id },
            data: { status: $Enums.FriendRequestStatus.DECLINED }, // [CHANGED] снимаем дружбу
        });
    }

    /**
     * Список моих друзей (возвращаем пользователей, а не заявки)
     */
    async listFriends(currentUserId: string) {
        const rows = await prisma.friendRequest.findMany({
            where: {
                status: $Enums.FriendRequestStatus.ACCEPTED, // [CHANGED]
                OR: [{ fromId: currentUserId }, { toId: currentUserId }],
            },
            include: { from: true, to: true },
            orderBy: { updatedAt: 'desc' },
        });

        return rows.map((fr) => {
            const other = fr.fromId === currentUserId ? fr.to : fr.from;
            return { id: other.id, email: other.email, name: other.name, handle: other.handle };
        });
    }

    /**
     * Список заявок
     */
    async listRequests(currentUserId: string, type?: 'incoming' | 'outgoing') {
        const where =
            type === 'incoming'
                ? { toId: currentUserId }
                : type === 'outgoing'
                    ? { fromId: currentUserId }
                    : { OR: [{ toId: currentUserId }, { fromId: currentUserId }] };

        return prisma.friendRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { from: true, to: true },
        });
    }

    /**
     * Поиск пользователей по handle (SQLite: без mode:'insensitive')
     * Сохраняем lowercased handle в базе → ищем тоже по lowercased
     */
    async searchUsersByHandle(q: string) {
        if (!q || q.trim().length < 2) return [];
        const qq = q.trim().toLowerCase(); // [ADDED]
        return prisma.user.findMany({
            where: { handle: { contains: qq } }, // [FIX] убран mode: 'insensitive'
            take: 20,
            orderBy: { handle: 'asc' },
            select: { id: true, email: true, name: true, handle: true },
        });
    }
}
