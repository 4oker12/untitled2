// src/modules/messages/messages.controller.ts
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../../common/jwt.guard.js';
import { CurrentUser, type CurrentUserPayload } from '../../common/current-user.decorator.js';
import { MessagesService } from './messages.service.js';

@ApiTags('messages')
@ApiCookieAuth('cookie-auth')
@Controller('messages')
export class MessagesController {
    constructor(private readonly svc: MessagesService) {}

    @Get(':otherUserId')
    async list(@CurrentUser() user: CurrentUserPayload, @Param('otherUserId') other: string) {
        const data = await this.svc.list(user.sub, other);
        return { data };
    }

    @Post()
    async send(@CurrentUser() user: CurrentUserPayload, @Body() dto: { toUserId: string; body: string }) {
        const data = await this.svc.send(user.sub, dto.toUserId, dto.body);
        return { data };
    }
}
