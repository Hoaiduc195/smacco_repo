import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { PlacesModule } from '../places/places.module';
import { GoogleMapsService } from './google-maps.service';

@Module({
  imports: [PlacesModule],
  controllers: [SearchController],
  providers: [SearchService, GoogleMapsService],
})
export class SearchModule {}
