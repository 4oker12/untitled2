import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { UsersModule } from '../users/users.module.js';
import { ConfigModule } from '../config/config.module.js';

@Module({ imports: [forwardRef(() => UsersModule), ConfigModule], providers: [AuthService], controllers: [AuthController], exports: [AuthService] })
export class AuthModule {}
