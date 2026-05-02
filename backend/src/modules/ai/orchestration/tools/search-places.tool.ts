import { Injectable } from '@nestjs/common';
import { ITool, ToolInput, ToolOutput } from './tool.interface';
import { SearchService } from '../../../search/search.service';

@Injectable()
export class SearchPlacesTool implements ITool {
  readonly id = 'hybrid_search';
  readonly description = 'Searches for places using external providers and the local database.';

  constructor(private readonly searchService: SearchService) {}

  async execute(inputs: ToolInput): Promise<ToolOutput> {
    try {
      const results = await this.searchService.search({
        q: inputs.query,
        location: inputs.location,
        budget: inputs.budget,
        type: inputs.type,
      });

      return {
        status: 'success',
        data: results,
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message || 'Failed to search places',
      };
    }
  }
}
