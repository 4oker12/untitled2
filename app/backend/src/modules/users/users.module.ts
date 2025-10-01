import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';


@Module({ imports: [PrismaModule, forwardRef(() => AuthModule)], providers: [UsersService], controllers: [UsersController], exports: [UsersService] })
export class UsersModule {}
