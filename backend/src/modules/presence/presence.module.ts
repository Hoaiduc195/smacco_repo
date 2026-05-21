import { Module } from '@nestjs/common';
import { PresenceController } from './presence.controller';
import { PresenceService } from './presence.service';
import { UsersModule } from '../users/users.module';
import { PlacesModule } from '../places/places.module';

@Module({
  imports: [UsersModule, PlacesModule],
  controllers: [PresenceController],
  providers: [PresenceService],
  exports: [PresenceService],
})
export class PresenceModule {}
