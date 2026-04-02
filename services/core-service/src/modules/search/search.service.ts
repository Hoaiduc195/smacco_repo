import { Inject, Injectable, Logger } from '@nestjs/common';
import { PlacesService } from '../places/places.service';
import {
  ACCOMMODATION_PROVIDERS,
  AccommodationProvider,
} from './accommodation-provider.interface';

export interface SearchFilters {
  q?: string;
  type?: string;
  location?: string;
  budget?: string;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly placesService: PlacesService,
    @Inject(ACCOMMODATION_PROVIDERS)
    private readonly providers: AccommodationProvider[],
  ) {}

  async search(filters: SearchFilters) {
    const budget = this.normalizeBudget(filters.budget);

    const queryParts = [filters.q, filters.type, filters.location].filter(Boolean);
    const query = queryParts.length ? queryParts.join(' ') : 'lodging';

    for (const provider of this.providers) {
      try {
        const results = await provider.searchAccommodations({
          query,
          budget,
        });
        if (results.length) return results;
      } catch (error) {
        this.logger.warn(`Provider ${provider.constructor.name} failed: ${error}`);
      }
    }

    // Fallback to local DB search
    return this.placesService.findAll({
      type: filters.type,
      city: filters.location,
    });
  }

  private normalizeBudget(budget?: string): 'low' | 'mid' | 'high' | undefined {
    if (!budget) return undefined;
    const value = budget.toLowerCase();
    if (['low', 'cheap', 'budget'].includes(value)) return 'low';
    if (['mid', 'medium', 'midrange', 'mid-range'].includes(value)) return 'mid';
    if (['high', 'luxury', 'premium'].includes(value)) return 'high';
    return undefined;
  }
}
