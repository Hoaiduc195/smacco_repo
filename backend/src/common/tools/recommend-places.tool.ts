import { Injectable } from '@nestjs/common';
import { IUnifiedTool, UnifiedToolInput, UnifiedToolOutput } from './tool.interface';
import { RecommendationsService } from '../../modules/recommendations/recommendations.service';

@Injectable()
export class RecommendPlacesTool implements IUnifiedTool {
  readonly id = 'recommend_places';
  readonly description = 'Ranks and filters places using the recommendations module.' +
    ' Filters for Vietnam, scores by rating/budget/distance, and runs intent-based tools.';

  constructor(private readonly recommendationsService: RecommendationsService) {}

  async execute(inputs: UnifiedToolInput): Promise<UnifiedToolOutput> {
    try {
      const places = Array.isArray(inputs.places) ? inputs.places : [];
      const budget = typeof inputs.budget === 'string' ? inputs.budget : undefined;
      const maxResults = typeof inputs.maxResults === 'number' ? inputs.maxResults : 10;
      const query = typeof inputs.query === 'string' ? inputs.query : '';
      const anchorLocation = inputs.anchorLocation;
      const anchorLabel = inputs.anchorLabel;

      const data = await this.recommendationsService.rankPlaces(
        places,
        { query, budget, maxResults, anchorLocation, anchorLabel },
      );

      return { status: 'success', data };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message || 'Failed to recommend places',
      };
    }
  }
}
