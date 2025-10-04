// app/backend/src/modules/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { FriendsModule } from './friends/friends.module.js';
import { MessagesModule } from './messages/messages.module.js';

@Module({
  imports: [
    ConfigModule,   // << твой собственный конфиг
    PrismaModule,
    UsersModule,
    AuthModule,
    FriendsModule,
    MessagesModule,
  ],
})
export class AppModule {}
