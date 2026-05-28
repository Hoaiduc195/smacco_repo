import { Injectable } from '@nestjs/common';
import { IUnifiedTool, UnifiedToolInput, UnifiedToolOutput } from './tool.interface';
import { SearchService } from '../../modules/search/search.service';

@Injectable()
export class SearchPlacesTool implements IUnifiedTool {
  readonly id = 'hybrid_search';
  readonly description = 'Searches for places using external providers and the local database.';

  constructor(private readonly searchService: SearchService) {}

  async execute(inputs: UnifiedToolInput): Promise<UnifiedToolOutput> {
    try {
      const results = await this.searchService.search({
        q: inputs.query,
        location: inputs.location,
        budget: inputs.budget,
        type: inputs.type,
        types: inputs.types,
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
