import { Injectable } from '@nestjs/common';
import { ITool, ToolInput, ToolOutput } from './tool.interface';
import { RecommenderService } from './recommender.service';

@Injectable()
export class RecommendPlacesTool implements ITool {
  readonly id = 'recommend_places';
  readonly description = 'Ranks and filters places by simple budget and rating signals.';

  constructor(private readonly recommender: RecommenderService) {}

  async execute(inputs: ToolInput): Promise<ToolOutput> {
    try {
      const places = Array.isArray(inputs.places) ? inputs.places : [];
      const budget = typeof inputs.budget === 'string' ? inputs.budget : undefined;
      const maxResults = typeof inputs.maxResults === 'number' ? inputs.maxResults : 5;

      const data = this.recommender.scorePlaces(places, { budget, maxResults });
      return { status: 'success', data };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message || 'Failed to recommend places',
      };
    }
  }
}
