// src/modules/friends/friends.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js'; // может больше не нужен — см. сервис
import { ConfigModule} from "../../config/config.module.js";
// import { ConfigModule } from '../../config/config.module.js'; // если вынес в src/config

import { FriendsController } from './friends.controller.js';
import { FriendsService } from './friends.service.js';

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [FriendsController],
    providers: [FriendsService],
})
export class FriendsModule {}
