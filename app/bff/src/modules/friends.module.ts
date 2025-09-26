// [CHANGED] добавили FriendsResolver и BackendModule
import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsResolver } from './friends.resolver';
import { BackendModule } from './backend.module';

@Module({
  imports: [BackendModule],          // [ADDED]
  providers: [FriendsService, FriendsResolver], // [CHANGED]
  exports: [FriendsService],         // [ADDED] (если где-то ещё понадобится)
})
export class FriendsModule {}
