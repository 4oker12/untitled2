import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({ imports: [forwardRef(() => AuthModule)], providers: [UsersService], controllers: [UsersController], exports: [UsersService] })
export class UsersModule {}
