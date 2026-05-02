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

    let externalResults: PlaceResult[] = [];
    let localResults: PlaceResult[] = [];

    try {
      // 1. Execute DB search and External Provider searches concurrently
      const providerRequests = this.providers.map((provider) =>
        provider.searchAccommodations({
          query,
          type: filters.type,
          budget,
          latitude: filters.latitude,
          longitude: filters.longitude,
        }),
      );

      const dbRequest = this.placesService.findAll({
        type: filters.type,
        city: filters.location,
        q: filters.q,
      });

      const [dbPlaces, ...resultsArray] = await Promise.all([
        dbRequest.catch(err => {
          this.logger.error(`Database search failed: ${err.message}`);
          return []; // Return empty array on DB failure to not block external search
        }),
        ...providerRequests.map(p => p.catch(err => {
          this.logger.error(`External provider search failed: ${err.message}`);
          return []; // Return empty array on provider failure
        }))
      ]);

      // 2. Process Local Results
      localResults = (dbPlaces as any[]).map((p: any): PlaceResult => ({
        locationId: p.id,
        sourcePlaceId: p.sourcePlaceId, // Keep source ID to deduplicate against external
        name: p.placeName || 'Unknown',
        address: p.placeAddress,
        location: p.lat && p.lng ? { lat: p.lat, lng: p.lng } : undefined,
        types: p.categories,
        source: p.source || 'internal', // Mark as internal
      }));

      // 3. Process External Results
      externalResults = resultsArray.flatMap(res => res as PlaceResult[]);

    } catch (error) {
      this.logger.error(`Search process failed critically: ${(error as any).message}`);
    }

    // 4. Merge and Deduplicate (Prioritizing Local Results)
    return this.mergeAndPrioritizeLocal(localResults, externalResults);
  }

  private mergeAndPrioritizeLocal(localResults: PlaceResult[], externalResults: PlaceResult[]): PlaceResult[] {
    const finalResults: PlaceResult[] = [...localResults];
    const seenKeys = new Set<string>();

    // 1. Add all local results to the "seen" set
    for (const localPlace of localResults) {
      // Create a composite key for local places: usually by sourcePlaceId if it came from an external source originally
      if (localPlace.sourcePlaceId) {
        seenKeys.add(localPlace.sourcePlaceId);
      }
      
      // Also index by name + coordinates to catch rough matches
      if (localPlace.location?.lat && localPlace.location?.lng) {
        const coordKey = `${localPlace.name.toLowerCase()}-${localPlace.location.lat.toFixed(3)}-${localPlace.location.lng.toFixed(3)}`;
        seenKeys.add(coordKey);
      }
    }

    // 2. Iterate through external results and only add if they haven't been "seen" in local DB
    for (const extPlace of externalResults) {
      const extSourceId = extPlace.locationId; // Assuming locationId from external is the source ID
      
      let isDuplicate = false;
      
      if (extSourceId && seenKeys.has(extSourceId)) {
        isDuplicate = true;
      }
      
      if (!isDuplicate && extPlace.location?.lat && extPlace.location?.lng) {
        const coordKey = `${extPlace.name.toLowerCase()}-${extPlace.location.lat.toFixed(3)}-${extPlace.location.lng.toFixed(3)}`;
        if (seenKeys.has(coordKey)) {
          isDuplicate = true;
        }
      }

      if (!isDuplicate) {
        finalResults.push(extPlace);
        
        // Mark as seen to deduplicate against other external providers
        if (extSourceId) seenKeys.add(extSourceId);
        if (extPlace.location?.lat && extPlace.location?.lng) {
          seenKeys.add(`${extPlace.name.toLowerCase()}-${extPlace.location.lat.toFixed(3)}-${extPlace.location.lng.toFixed(3)}`);
        }
      }
    }

    return finalResults;
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
