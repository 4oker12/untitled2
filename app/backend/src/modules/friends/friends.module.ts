import { Module } from '@nestjs/common';
import { FriendsController } from './friends.controller.js';
import { FriendsService } from './friends.service.js';

@Module({
    controllers: [FriendsController],
    providers: [FriendsService],
})
export class FriendsModule {}
