// app/backend/src/modules/auth/auth.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { UsersModule } from '../users/users.module.js';
import { ConfigModule } from '../config/config.module.js';

@Module({
    imports: [
        forwardRef(() => UsersModule),
        ConfigModule, // << твой модуль с ConfigService
    ],
    providers: [AuthService],
    controllers: [AuthController],
    exports: [AuthService], // чтобы Friends/другие могли юзать методы AuthService
})
export class AuthModule {}
