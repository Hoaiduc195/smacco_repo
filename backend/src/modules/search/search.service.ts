import { Inject, Injectable, Logger } from '@nestjs/common';
import { PlacesService } from '../places/places.service';
import {
  ACCOMMODATION_PROVIDERS,
  AccommodationProvider,
  PlaceResult,
} from './accommodation-provider.interface';

export interface SearchFilters {
  q?: string;
  type?: string;
  location?: string;
  budget?: string;
  latitude?: number;
  longitude?: number;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly placesService: PlacesService,
    @Inject(ACCOMMODATION_PROVIDERS)
    private readonly providers: AccommodationProvider[],
  ) {}

  async search(filters: SearchFilters): Promise<PlaceResult[]> {
    const budget = this.normalizeBudget(filters.budget);

    const queryParts = [filters.q, filters.type, filters.location].filter(Boolean);
    const query = queryParts.length ? queryParts.join(' ') : 'lodging';

    this.logger.log(`Searching for: "${query}" with budget: ${budget || 'any'}`);

    try {
      const providerRequests = this.providers.map((provider) =>
        provider.searchAccommodations({
          query,
          type: filters.type,
          budget,
          latitude: filters.latitude,
          longitude: filters.longitude,
        }),
      );

      const resultsArray = await Promise.allSettled(providerRequests);

      const allResults: PlaceResult[] = resultsArray
        .filter((res): res is PromiseFulfilledResult<PlaceResult[]> => res.status === 'fulfilled')
        .flatMap((res) => res.value);

      if (allResults.length > 0) {
        return this.deduplicateResults(allResults);
      }
    } catch (error) {
      this.logger.error(`Search process failed: ${(error as any).message}`);
    }

    this.logger.log('No results from external providers, falling back to local database');
    const dbPlaces = await this.placesService.findAll({
      type: filters.type,
      city: filters.location,
    });

    return dbPlaces.map((p: any): PlaceResult => ({
      locationId: p.id,
      name: p.placeName || 'Unknown',
      address: p.placeAddress,
      location: p.lat && p.lng ? { lat: p.lat, lng: p.lng } : undefined,
      types: p.categories,
    }));
  }

  private deduplicateResults(results: PlaceResult[]): PlaceResult[] {
    const seen = new Set();
    return results.filter((item) => {
      const duplicateKey = item.locationId || `${item.name}-${item.location?.lat}-${item.location?.lng}`;
      if (seen.has(duplicateKey)) return false;
      seen.add(duplicateKey);
      return true;
    });
  }

  private normalizeBudget(budget?: string): 'low' | 'mid' | 'high' | undefined {
    if (!budget) return undefined;
    const value = budget.toLowerCase().trim();
    if (['low', 'cheap', 'budget', 'rẻ', 'bình dân'].includes(value)) return 'low';
    if (['mid', 'medium', 'midrange', 'mid-range', 'vừa'].includes(value)) return 'mid';
    if (['high', 'luxury', 'premium', 'sang trọng', 'cao cấp'].includes(value)) return 'high';
    return undefined;
  }
}
