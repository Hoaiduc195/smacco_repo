import { Module } from '@nestjs/common';
import { SavedPlacesController } from './saved-places.controller';
import { SavedPlacesService } from './saved-places.service';
import { UsersModule } from '../users/users.module';
import { PlacesModule } from '../places/places.module';

@Module({
  imports: [UsersModule, PlacesModule],
  controllers: [SavedPlacesController],
  providers: [SavedPlacesService],
  exports: [SavedPlacesService],
})
export class SavedPlacesModule {}
