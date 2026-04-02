import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { PlacesModule } from '../places/places.module';
import { GoogleMapsService } from './google-maps.service';
import { OsmPlacesService } from './osm-places.service';
import { ACCOMMODATION_PROVIDERS } from './accommodation-provider.interface';

@Module({
  imports: [PlacesModule, HttpModule],
  controllers: [SearchController],
  providers: [
    SearchService,
    GoogleMapsService,
    OsmPlacesService,
    {
      provide: ACCOMMODATION_PROVIDERS,
      useFactory: (osm: OsmPlacesService, google: GoogleMapsService) => [osm, google],
      inject: [OsmPlacesService, GoogleMapsService],
    },
  ],
})
export class SearchModule {}
