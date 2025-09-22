import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { ConfigModule } from './config/config.module.js';

@Module({
  imports: [ConfigModule, AuthModule, UsersModule],
})
export class AppModule {}
