// app/bff/src/modules/messages/messages.module.ts
import { Module } from '@nestjs/common';
import { MessagesResolver } from './messages.resolver.js';

@Module({
    providers: [MessagesResolver],
    exports: [MessagesResolver],
})
export class MessagesModule {}
