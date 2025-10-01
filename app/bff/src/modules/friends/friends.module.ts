// bff/src/modules/friends.module.ts
// CHANGED: только сервис + резолвер (никаких REST-прокси)

import { Module } from '@nestjs/common';
import { BackendModule } from '../backend.module';
import { FriendsService } from './friends.service';
import { FriendsResolver } from './friends.resolver';

@Module({
  imports: [BackendModule],
  providers: [FriendsService, FriendsResolver],
})
export class FriendsModule {}
