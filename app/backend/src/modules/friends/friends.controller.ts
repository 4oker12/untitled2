// src/modules/friends/friends.controller.ts
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type CurrentUserPayload } from '../../common/current-user.decorator.js';
import { FriendsService } from './friends.service.js';
import { CreateFriendRequestDto, FriendRequestDto, PublicUserDto } from './friends.dto.js';

@ApiTags('friends')
@ApiCookieAuth('cookie-auth')
@Controller('friends')
export class FriendsController {
    constructor(private readonly service: FriendsService) {}

    @Get()
    @ApiResponse({ status: 200 })
    async list(@CurrentUser() user: CurrentUserPayload): Promise<{ data: PublicUserDto[] }> {
        const data = await this.service.list(user.sub);
        return { data };
    }

    @Get('requests')
    @ApiResponse({ status: 200 })
    async listRequests(
        @CurrentUser() user: CurrentUserPayload,
        @Query('type') type?: 'incoming' | 'outgoing',
    ): Promise<{ data: FriendRequestDto[] }> {
        const data = await this.service.listRequests(user.sub, type);
        return { data };
    }

    @Post('requests')
    @ApiResponse({ status: 201 })
    async createRequest(
        @CurrentUser() user: CurrentUserPayload,
        @Body() dto: CreateFriendRequestDto,
    ): Promise<{ data: FriendRequestDto }> {
        const data = await this.service.createRequest(user.sub, dto);
        return { data };
    }

    @Post('requests/:id/accept')
    async accept(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
        const data = await this.service.accept(user.sub, id);
        return { data };
    }

    @Post('requests/:id/decline')
    async decline(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
        const data = await this.service.decline(user.sub, id);
        return { data };
    }

    @Delete('requests/:id')
    async cancel(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
        const data = await this.service.cancel(user.sub, id);
        return { data };
    }
}
