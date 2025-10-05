// app/backend/src/modules/profile/profile.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { ConfigModule } from '../../config/config.module.js'; // << добавили
import { ProfileController } from './profile.controller.js';
import { ProfileService } from './profile.service.js';

@Module({
    imports: [PrismaModule, ConfigModule], // << здесь теперь есть ConfigModule
    controllers: [ProfileController],
    providers: [ProfileService], // << регистрируем guard в модуле
})
export class ProfileModule {}
