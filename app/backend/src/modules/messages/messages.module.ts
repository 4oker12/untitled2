// app/backend/src/modules/messages/messages.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { MessagesController } from './messages.controller.js';
import { MessagesService } from './messages.service.js';
import { JwtGuard } from '../../common/jwt.guard.js';
import { ConfigModule } from '../config/config.module.js';

@Module({
    imports: [
        PrismaModule,
        ConfigModule, // << даст JwtGuard-у твой ConfigService
    ],
    controllers: [MessagesController],
    providers: [MessagesService, JwtGuard],
})
export class MessagesModule {}
