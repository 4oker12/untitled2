// src/modules/messages/messages.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { ConfigModule} from "../../config/config.module.js";
// import { ConfigModule } from '../../config/config.module.js'; // если вынес в src/config

import { MessagesController } from './messages.controller.js';
import { MessagesService } from './messages.service.js';

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [MessagesController],
    providers: [MessagesService],
})
export class MessagesModule {}
