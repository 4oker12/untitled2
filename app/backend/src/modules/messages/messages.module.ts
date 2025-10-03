import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { MessagesController } from './messages.controller.js';
import { MessagesService } from './messages.service.js';
import { JwtGuard } from '../../common/jwt.guard.js';


@Module({
    imports: [PrismaModule],
    controllers: [MessagesController],
    providers: [MessagesService, JwtGuard],
})
export class MessagesModule {}
