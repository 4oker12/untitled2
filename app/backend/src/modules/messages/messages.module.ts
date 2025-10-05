import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller.js';
import { MessagesService } from './messages.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Module({
    controllers: [MessagesController],
    providers: [MessagesService, PrismaService],
    exports: [MessagesService],
})
export class MessagesModule {}
