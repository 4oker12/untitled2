import { Body, Controller, Get, Post, Query, Req, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { MessagesService } from './messages.service.js';
import { JwtGuard } from '../../common/jwt.guard.js';
import { SendMessageDto, ListMessagesDto } from './messages.dto.js';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('messages')
export class MessagesController {
    constructor(private readonly svc: MessagesService) {}

    @Post()
    @ApiBody({ type: SendMessageDto }) // Явно подсказываем Swagger'у форму тела
    async send(@Req() req: any, @Body() body: SendMessageDto) {
        const meId = req.user.id;
        const msg = await this.svc.send(meId, body.toUserId, body.body);
        return { data: msg };
    }

    @Get()
    async list(@Req() req: any, @Query() q: ListMessagesDto) {
        const meId = req.user.id;
        const list = await this.svc.list(meId, q.withUserId, q.take ?? 20, q.cursor);
        return { data: list };
    }

    @Post(':id/read')
    async markRead(@Req() req: any, @Param('id') id: string) {
        const meId = req.user.id;
        const msg = await this.svc.markRead(meId, id);
        return { data: msg };
    }
}
