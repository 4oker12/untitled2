// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { ConfigModule } from '../../config/config.module.js';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'dev-secret',
            // expiresIn на уровне signAsync тоже ок — оставляй где удобнее
        }),
        ConfigModule
    ],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [AuthService, JwtModule], // <- важно
})
export class AuthModule {}
