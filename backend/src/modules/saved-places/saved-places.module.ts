import { Module } from '@nestjs/common';
import { SavedPlacesController } from './saved-places.controller';
import { SavedPlacesService } from './saved-places.service';
import { UsersModule } from '../users/users.module';
import { PlacesModule } from '../places/places.module';
import { RuntimeConfigModule } from '../../config/runtime-config.module';

@Module({
  imports: [UsersModule, PlacesModule, RuntimeConfigModule],
  controllers: [SavedPlacesController],
  providers: [SavedPlacesService],
  exports: [SavedPlacesService],
})
export class SavedPlacesModule {}
