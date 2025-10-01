// src/modules/friends/friends.controller.ts

import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiCookieAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FriendsService } from './friends.service.js';
import { CreateFriendRequestDto, FriendRequestDto, PublicUserDto } from './friends.dto.js';

@ApiTags('friends')
@ApiCookieAuth('access_token')
@Controller('friends')
export class FriendsController {
    constructor(private readonly service: FriendsService) {}

    @Get()
    @ApiResponse({ status: 200 })
    async listFriends(@Req() req: Request): Promise<{ data: PublicUserDto[] }> {
        const { data } = await this.service.listFriends(req); // CHANGED: деструктурируем
        return { data };
    }

    @Get('requests')
    @ApiResponse({ status: 200 })
    async listRequests(
        @Req() req: Request,
        @Query('type') type?: 'incoming' | 'outgoing',
    ): Promise<{ data: FriendRequestDto[] }> {
        const { data } = await this.service.listRequests(req, type); // CHANGED
        return { data };
    }

    @Post('requests')
    @ApiResponse({ status: 201 })
    async createRequest(
        @Req() req: Request,
        @Body() body: CreateFriendRequestDto,
    ): Promise<{ data: FriendRequestDto }> {
        const { data } = await this.service.createRequest(req, body); // CHANGED
        return { data };
    }

    @Post('requests/:id/accept')
    @ApiResponse({ status: 200 })
    async accept(@Req() req: Request, @Param('id') id: string): Promise<{ data: FriendRequestDto }> {
        const { data } = await this.service.accept(req, id); // CHANGED: тип возвращаемого согласован
        return { data };
    }

    @Post('requests/:id/decline')
    @ApiResponse({ status: 200 })
    async decline(@Req() req: Request, @Param('id') id: string): Promise<{ data: FriendRequestDto }> {
        const { data } = await this.service.decline(req, id); // CHANGED
        return { data };
    }

    @Post('requests/:id/cancel')
    @ApiResponse({ status: 200 })
    async cancel(@Req() req: Request, @Param('id') id: string): Promise<{ data: FriendRequestDto }> {
        const { data } = await this.service.cancel(req, id); // CHANGED: метод добавлен в сервис
        return { data };
    }

    @Delete(':userId')
    @ApiResponse({ status: 200 })
    async remove(@Req() req: Request, @Param('userId') userId: string): Promise<{ data: boolean }> {
        return this.service.removeFriend(req, userId); // OK
    }

    // Не нужен? — можно удалить весь endpoint.
    @Get('search/users')
    @ApiResponse({ status: 200 })
    async searchUsers(@Query('q') q: string): Promise<{ data: PublicUserDto[] }> {
        const { data } = await this.service.searchUsers(q); // CHANGED
        return { data };
    }
}
