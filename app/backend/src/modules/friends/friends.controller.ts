import { Controller, Get, Post, Delete, Body, Param, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiCookieAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FriendsService } from './friends.service.js';
import { SendFriendRequestDto, IdParamDto, ListRequestsQueryDto, FriendRequestDto, FriendUserDto } from './dto.js';

@ApiTags('friends')
@ApiCookieAuth('access_token')
@Controller('friends')
export class FriendsController {
    constructor(private readonly friends: FriendsService) {}

    /** Список друзей */
    @Get()
    @ApiResponse({ status: 200, type: [FriendUserDto] })
    async list(@Req() req: Request) {
        const me = (req as any).user; // предполагается, что ты вешал user в req (auth middleware/guard)
        const data = await this.friends.listFriends(me.id);
        return { data };
    }

    /** Отправить заявку в друзья */
    @Post('requests')
    @ApiResponse({ status: 201, type: FriendRequestDto })
    async send(@Req() req: Request, @Body() body: SendFriendRequestDto) {
        const me = (req as any).user;
        const fr = await this.friends.sendRequest(me.id, body.toHandle);
        return { data: fr };
    }

    /** Список заявок (incoming/outgoing) */
    @Get('requests')
    @ApiResponse({ status: 200, type: [FriendRequestDto] })
    async requests(@Req() req: Request, @Query() query: ListRequestsQueryDto) {
        const me = (req as any).user;
        const data = await this.friends.listRequests(me.id, query.type);
        return { data };
    }

    /** Принять заявку */
    @Post('requests/:id/accept')
    @ApiResponse({ status: 200, type: FriendRequestDto })
    async accept(@Req() req: Request, @Param() p: IdParamDto) {
        const me = (req as any).user;
        const fr = await this.friends.acceptRequest(me.id, p.id);
        return { data: fr };
    }

    /** Отклонить заявку */
    @Post('requests/:id/decline')
    @ApiResponse({ status: 200, type: FriendRequestDto })
    async decline(@Req() req: Request, @Param() p: IdParamDto) {
        const me = (req as any).user;
        const fr = await this.friends.declineRequest(me.id, p.id);
        return { data: fr };
    }

    /** Отменить исходящую заявку */
    @Post('requests/:id/cancel')
    @ApiResponse({ status: 200, type: FriendRequestDto })
    async cancel(@Req() req: Request, @Param() p: IdParamDto) {
        const me = (req as any).user;
        const fr = await this.friends.cancelRequest(me.id, p.id);
        return { data: fr };
    }

    /** Удалить друга */
    @Delete(':userId')
    async remove(@Req() req: Request, @Param('userId') userId: string) {
        const me = (req as any).user;
        const res = await this.friends.removeFriend(me.id, userId);
        return { data: res };
    }
}
