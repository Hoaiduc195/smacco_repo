import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { PlacesModule } from '../places/places.module';
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
    OsmPlacesService,
    {
      provide: ACCOMMODATION_PROVIDERS,
      useFactory: (osm: OsmPlacesService) => [osm],
      inject: [OsmPlacesService],
    },
  ],
  exports: [SearchService],
})
export class SearchModule {}
