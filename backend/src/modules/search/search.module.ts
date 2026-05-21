import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { PlacesModule } from '../places/places.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { GoongPlacesService } from './goong-places.service';
import { SerpApiHotelsService } from './serpapi-hotels.service';
import { ACCOMMODATION_PROVIDERS } from './accommodation-provider.interface';

@Module({
  imports: [
    PlacesModule,
    RecommendationsModule,
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 5,
    }),
  ],
  controllers: [SearchController],
  providers: [
    SearchService,
    GoongPlacesService,
    SerpApiHotelsService,
    {
      provide: ACCOMMODATION_PROVIDERS,
      useFactory: (serpapi: SerpApiHotelsService) => [serpapi],
      inject: [SerpApiHotelsService],
    },
  ],
  exports: [SearchService],
})
export class SearchModule {}
