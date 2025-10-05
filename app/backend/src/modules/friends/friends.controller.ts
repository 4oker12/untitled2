// src/modules/friends/friends.controller.ts
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload } from '../../common/current-user.decorator.js';
import { FriendsService } from './friends.service.js';
import {
    CreateFriendRequestDto,
    FriendRequestDto,
    PublicUserDto,
    SearchUsersQueryDto,
} from './friends.dto.js';

const ok = <T>(data: T) => ({ data });

@ApiTags('friends')
@ApiCookieAuth('cookie-auth')
@Controller('friends')
export class FriendsController {
    constructor(private readonly service: FriendsService) {}

    /** Список друзей текущего пользователя */
    @Get()
    @ApiResponse({ status: 200 })
    async list(@CurrentUser() user: CurrentUserPayload): Promise<{ data: PublicUserDto[] }> {
        const data = await this.service.list(user.sub);
        return ok(data);
    }

    /** Поиск пользователей для добавления в друзья (минимум 2 символа) */
    @Get('search/users')
    @ApiResponse({ status: 200 })
    async search(
        @CurrentUser() user: CurrentUserPayload,
        @Query() q: SearchUsersQueryDto,
    ): Promise<{ data: { items: PublicUserDto[]; nextCursor?: string } }> {
        if (!q.q || q.q.length < 2) return ok({ items: [], nextCursor: undefined });
        const data = await this.service.searchUsers(user.sub, q.q, q.cursor, q.take);
        return ok(data);
    }

    @Get('requests')
    @ApiResponse({ status: 200 })
    async listRequests(
        @CurrentUser() user: CurrentUserPayload,
        @Query('type') type?: 'incoming' | 'outgoing',
    ): Promise<{ data: FriendRequestDto[] }> {
        const data = await this.service.listRequests(user.sub, type);
        return ok(data);
    }

    @Post('requests')
    @ApiResponse({ status: 201 })
    async createRequest(
        @CurrentUser() user: CurrentUserPayload,
        @Body() dto: CreateFriendRequestDto,
    ): Promise<{ data: FriendRequestDto }> {
        const data = await this.service.createRequest(user.sub, dto);
        return ok(data);
    }

    @Post('requests/:id/accept')
    async accept(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
        const data = await this.service.accept(user.sub, id);
        return ok(data);
    }

    @Post('requests/:id/decline')
    async decline(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
        const data = await this.service.decline(user.sub, id);
        return ok(data);
    }

    @Delete('requests/:id')
    async cancel(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
        const data = await this.service.cancel(user.sub, id);
        return ok(data);
    }
}
