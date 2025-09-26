import { Module, Global } from '@nestjs/common';
import { BackendClient } from './backend.client';

@Global()
@Module({
    providers: [BackendClient],
    exports: [BackendClient], // ОБЯЗАТЕЛЬНО: чтобы можно было инжектить в резолверы
})
export class BackendModule {}
