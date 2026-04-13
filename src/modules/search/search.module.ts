import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { PlacesModule } from '../places/places.module';
import { GoogleMapsService } from './google-maps.service';
import { OsmPlacesService } from './osm-places.service';
import { ACCOMMODATION_PROVIDERS } from './accommodation-provider.interface';

@Module({
  imports: [
    PlacesModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [SearchController],
  providers: [
    SearchService,
    GoogleMapsService,
    OsmPlacesService,
    {
      provide: ACCOMMODATION_PROVIDERS,
      useFactory: (google: GoogleMapsService, osm: OsmPlacesService) => [google, osm],
      inject: [GoogleMapsService, OsmPlacesService],
    },
  ],
  exports: [SearchService],
})
export class SearchModule {}
