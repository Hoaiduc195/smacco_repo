import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { NearbyAmenitiesTool } from '../../common/tools/nearby-amenities.tool';
import { ProximityCheckerTool } from '../../common/tools/proximity-checker.tool';

@Module({
  imports: [HttpModule.register({ timeout: 15000, maxRedirects: 3 })],
  controllers: [RecommendationsController],
  providers: [
    RecommendationsService,
    NearbyAmenitiesTool,
    ProximityCheckerTool,
  ],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
