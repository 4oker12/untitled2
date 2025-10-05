// app/backend/src/modules/common/common.module.ts
import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '../config/config.module.js';
import { JwtAuthGuard} from "../modules/auth/jwt-auth.guard.js";

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        // регистрируем как глобальный guard
        { provide: APP_GUARD, useClass: JwtAuthGuard },
    ],
    exports: [],
})
export class CommonModule {}
