import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';
import { LocalFixturePlacesService } from './local-fixture-places.service';

@Module({
  imports: [HttpModule],
  controllers: [PlacesController],
  providers: [PlacesService, LocalFixturePlacesService],
  exports: [PlacesService, LocalFixturePlacesService],
})
export class PlacesModule {}
