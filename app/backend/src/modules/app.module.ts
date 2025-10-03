import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { ConfigModule } from './config/config.module.js';
import { FriendsModule } from './friends/friends.module.js';
import { PrismaModule } from '../prisma/prisma.module.js'
import {MessagesModule} from "./messages/messages.module.js";


@Module({
  imports: [PrismaModule, ConfigModule, AuthModule, UsersModule, FriendsModule, MessagesModule],
})
export class AppModule {}
