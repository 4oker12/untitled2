// src/modules/friends.module.ts
import { Module } from '@nestjs/common';
import { FriendsController } from './friends.controller.js';
import { FriendsService } from './friends.service.js';
import { BackendModule } from './backend.module.js'; // [ADDED]

@Module({
  imports: [
    BackendModule, // [ADDED] чтобы FriendsService мог инжектить BackendClient
  ],
  controllers: [FriendsController],
  providers: [FriendsService],
})
export class FriendsModule {}
