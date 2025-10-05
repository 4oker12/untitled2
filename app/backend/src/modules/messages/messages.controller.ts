import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MessagesService } from './messages.service.js';
// у тебя CurrentUser лежит в src/common/current-user.decorator.ts
import { CurrentUser } from '../../common/current-user.decorator.js';

// локальный helper, чтобы не тянуть общий envelope-файл
const ok = <T>(data: T) => ({ data });

// локальное приведение ответа (без отдельного view-файла)
function mapMessage(m: any) {
    return {
        id: m.id,
        from: { id: m.from.id, handle: m.from.handle ?? null, name: m.from.name ?? null },
        to:   { id: m.to.id, handle: m.to.handle ?? null, name: m.to.name ?? null },
        body: m.body,
        createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
        readAt: m.readAt ? (m.readAt instanceof Date ? m.readAt.toISOString() : m.readAt) : null,
    };
}

import {
    SendMessageDto,
    ListMessagesQueryDto,
    MarkReadDto,
    ListPeersQueryDto,
} from './messages.dto.js';

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
    constructor(private readonly messages: MessagesService) {}

    @Post()
    async send(@CurrentUser() user: { sub: string }, @Body() dto: SendMessageDto) {
        const msg = await this.messages.send(user.sub, dto.to, dto.body);
        return ok(mapMessage(msg));
    }

    @Get()
    async list(@CurrentUser() user: { sub: string }, @Query() q: ListMessagesQueryDto) {
        const { items, nextCursor } = await this.messages.list(user.sub, q.with, q.cursor, q.take);
        return ok({ items: items.map(mapMessage), nextCursor });
    }

    @Post('read')
    async markRead(@CurrentUser() user: { sub: string }, @Body() dto: MarkReadDto) {
        const res = await this.messages.markRead(user.sub, dto.ids);
        return ok(res);
    }

    @Get('unread-summary')
    async unreadSummary(@CurrentUser() user: { sub: string }) {
        // форма ответа дружелюбная BFF и фронту
        return ({ data: await this.messages.unreadSummary(user.sub) });
    }

    @Get('unread-count')
    async unreadCount(@CurrentUser() user: { sub: string }) {
        return ok(await this.messages.unreadCount(user.sub));
    }

    @Get('unread-count/with/:peer')
    async unreadCountWith(@CurrentUser() user: { sub: string }, @Param('peer') peer: string) {
        return ok(await this.messages.unreadCountWith(user.sub, peer));
    }

    @Get('peers')
    async peers(@CurrentUser() user: { sub: string }, @Query() q: ListPeersQueryDto) {
        const { items, nextCursor } = await this.messages.peers(user.sub, q.q, q.cursor, q.take);
        // лёгкий маппинг lastMessage, чтобы фронт получил одинаковую форму
        const shaped = items.map(it => ({
            user: it.user,
            lastMessage: it.lastMessage ? mapMessage(it.lastMessage) : null,
            unreadCount: it.unreadCount,
        }));
        return ok({ items: shaped, nextCursor });
    }
}
