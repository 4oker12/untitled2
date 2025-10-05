// app/backend/src/modules/app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { ConfigModule } from '../config/config.module.js';
import {CommonModule} from "../common/common.module.js";
import { PrismaModule } from '../prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { FriendsModule } from './friends/friends.module.js';
import { MessagesModule } from './messages/messages.module.js';
import { ProfileModule } from './profile/profile.module.js';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth/auth.service.js';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';



@Module({
  imports: [
    AuthModule,
    ConfigModule,   // << твой собственный конфиг
    PrismaModule,
    CommonModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
    }),
    UsersModule,
    FriendsModule,
    MessagesModule,
    ProfileModule
  ],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
