import { Injectable, Logger } from '@nestjs/common';
import { PlacesService } from '../places/places.service';
import { GoogleMapsService } from './google-maps.service';

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
    private readonly googleMapsService: GoogleMapsService,
  ) {}

  async search(filters: SearchFilters) {
    const budget = this.normalizeBudget(filters.budget);

    // Prefer Google Maps search for accommodation
    try {
      const queryParts = [filters.q, filters.type, filters.location].filter(Boolean);
      const query = queryParts.length ? queryParts.join(' ') : 'lodging';

      const googleResults = await this.googleMapsService.searchAccommodations({
        query,
        budget,
      });

      if (googleResults.length) return googleResults;
    } catch (error) {
      this.logger.warn(`Google search failed, falling back to local DB: ${error}`);
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
