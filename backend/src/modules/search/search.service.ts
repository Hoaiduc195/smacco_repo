import { Inject, Injectable, Logger } from '@nestjs/common';
import { PlacesService } from '../places/places.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { GoongPlacesService } from './goong-places.service';
import {
  ACCOMMODATION_PROVIDERS,
  AccommodationProvider,
  PlaceResult,
} from './accommodation-provider.interface';
import { RuntimeConfigService } from '../../config/runtime-config.service';
import { ExternalProviderPolicy } from '../../config/runtime-config';

export interface SearchFilters {
  q?: string;
  type?: string;
  types?: string[];
  location?: string;
  budget?: string;
  latitude?: number;
  longitude?: number;
  checkInDate?: string;
  checkOutDate?: string;
  applyRecommendations?: boolean;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly placesService: PlacesService,
    private readonly recommendationsService: RecommendationsService,
    private readonly goongPlacesService: GoongPlacesService,
    private readonly runtimeConfig: RuntimeConfigService,
    @Inject(ACCOMMODATION_PROVIDERS)
    private readonly providers: AccommodationProvider[],
  ) {}

  async search(filters: SearchFilters): Promise<PlaceResult[]> {
    const budget = this.normalizeBudget(filters.budget);
    const typeFilters = this.normalizeTypes(filters.type, filters.types);
    const providerQuery = this.buildProviderQuery(filters.q, typeFilters, filters.location);
    const isFixtureOnlyMode = this.runtimeConfig.search.localFixture && !this.runtimeConfig.search.localDatabase;

    this.logger.log(`Searching for: "${providerQuery}" with budget: ${budget || 'any'}`);

    if (isFixtureOnlyMode) {
      // 1. Try strict search with location, type, and query
      let filteredPool = this.placesService.findLocalTestData({
        type: typeFilters.length > 0 ? typeFilters : filters.type,
        city: filters.location,
        q: filters.q,
      });

      // 2. Fallback to location only (helps when type/query doesn't match type tags strictly)
      if (filteredPool.length === 0 && filters.location) {
        filteredPool = this.placesService.findLocalTestData({
          city: filters.location,
        });
      }

      // 3. Fallback to query/type anywhere if location matches nothing
      if (filteredPool.length === 0 && (filters.q || filters.type)) {
        filteredPool = this.placesService.findLocalTestData({
          type: typeFilters.length > 0 ? typeFilters : filters.type,
          q: filters.q,
        });
      }

      // 4. Default fallback: return all local test data to select from
      if (filteredPool.length === 0) {
        filteredPool = this.placesService.findLocalTestData(undefined);
      }

      const randomPool = this.mapLocalFixturePlaces(filteredPool);
      return this.takeRandomResults(randomPool, 6);
    }

    let externalResults: PlaceResult[] = [];
    let localResults: PlaceResult[] = [];
    const searchConfig = this.runtimeConfig.search;

    try {
      const dbPlaces = searchConfig.localDatabase
        ? await this.placesService.findAll({
            type: typeFilters.length > 0 ? typeFilters : filters.type,
            city: filters.location,
            q: filters.q,
          }).catch((err) => {
            this.logger.error(`Database search failed: ${err.message}`);
            return [];
          })
        : [];

      const dbPlacesForMode = this.runtimeConfig.environment === 'production'
        ? (dbPlaces as any[]).filter((p: any) => p.source !== 'local')
        : (dbPlaces as any[]);

      const inMemoryLocalPlaces = searchConfig.localFixture
        ? this.placesService.findLocalTestData({
            type: typeFilters.length > 0 ? typeFilters : filters.type,
            city: filters.location,
            q: filters.q,
          })
        : [];

      // 3. Process Local Results (Combine DB places and in-memory local places)
      // First, map database places
      const mappedDbPlaces = dbPlacesForMode.map((p: any): PlaceResult => ({
        locationId: (p.source && p.source !== 'internal' && p.sourcePlaceId)
          ? `${p.source}-${p.sourcePlaceId}`
          : p.id,
        sourcePlaceId: p.sourcePlaceId, // Keep source ID to deduplicate against external
        name: p.placeName || 'Unknown',
        address: p.placeAddress,
        description: p.rawSerpApiPropertyDetails?.description || undefined,
        location: p.lat && p.lng ? { lat: p.lat, lng: p.lng } : undefined,
        types: p.categories,
        imageUrl: p.coverImageUrl || undefined,
        source: p.source || 'internal', // Mark as internal
        rating: p.averageRating || undefined,
        userRatingsTotal: p.reviewCount || undefined,
      }));

      // Now map in-memory local places
      const mappedInMemoryPlaces = inMemoryLocalPlaces.map((p: any): PlaceResult => ({
        locationId: p.id,
        sourcePlaceId: p.sourcePlaceId,
        name: p.placeName,
        address: p.placeAddress,
        description: p.rawSerpApiPropertyDetails?.description,
        location: { lat: p.lat, lng: p.lng },
        types: p.categories,
        imageUrl: p.coverImageUrl || undefined,
        source: 'local',
        rating: p.averageRating || undefined,
        userRatingsTotal: p.reviewCount || undefined,
        amenities: p.rawSerpApiPropertyDetails?.amenities,
      }));

      // Merge database places and in-memory test data (prioritizing DB stub records if they exist)
      const localMap = new Map<string, PlaceResult>();
      for (const p of mappedInMemoryPlaces) {
        localMap.set(p.locationId, p);
      }
      for (const p of mappedDbPlaces) {
        localMap.set(p.locationId, p);
      }
      localResults = Array.from(localMap.values());

      if (this.shouldQueryExternalProviders(localResults, filters, typeFilters, searchConfig.externalProviderPolicy)) {
        const providerRequests = this.providers.map((provider) =>
          provider.searchAccommodations({
            query: providerQuery,
            type: typeFilters.join(', '),
            types: typeFilters,
            budget,
            locationName: filters.location,
            latitude: filters.latitude,
            longitude: filters.longitude,
            checkInDate: filters.checkInDate,
            checkOutDate: filters.checkOutDate,
          }),
        );

        const resultsArray = await Promise.all(
          providerRequests.map((p) =>
            p.catch((err) => {
              this.logger.error(`External provider search failed: ${err.message}`);
              return [];
            }),
          ),
        );

        externalResults = resultsArray.flatMap((res) => res as PlaceResult[]);
      } else {
        this.logger.log(
          `Skipping external provider search because local results returned ${localResults.length} usable results.`,
        );
      }

    } catch (error) {
      this.logger.error(`Search process failed critically: ${(error as any).message}`);
    }

    // 4. Merge and Deduplicate (Prioritizing Local Results)
    let finalResults = this.mergeAndPrioritizeLocal(localResults, externalResults);

    // 5. Apply Recommendations if requested
    if (filters.applyRecommendations) {
      let anchorLocation = null;
      if (filters.location && searchConfig.externalProviders) {
        const geoResults = await this.goongPlacesService.searchAccommodations({ query: filters.location });
        if (geoResults.length > 0 && geoResults[0].location) {
          anchorLocation = geoResults[0].location;
        }
      }

      const ranked = await this.recommendationsService.rankPlaces(finalResults, {
        budget,
        anchorLocation,
        anchorLabel: filters.location,
        maxResults: 50 // Keep a good amount of results for basic search
      });
      finalResults = ranked.items;
    }

    // HARDCODE: Only return accommodation places
    const accommodationKeywords = [
      'hotel', 'resort', 'homestay', 'villa', 'guest_house', 'lodging', 'accommodation', 'hostel', 'motel',
      'khách sạn', 'khu nghỉ dưỡng', 'chỗ ở', 'phòng', 'biệt thự', 'nhà nghỉ'
    ];
    finalResults = finalResults.filter(place => {
      if (!place.types || place.types.length === 0) return true;
      return place.types.some(t => 
        accommodationKeywords.some(keyword => t.toLowerCase().includes(keyword))
      );
    });

    return finalResults;
  }

  private mapLocalFixturePlaces(localPlaces: any[]): PlaceResult[] {
    return localPlaces.map((place: any): PlaceResult => ({
      locationId: place.id,
      sourcePlaceId: place.sourcePlaceId,
      name: place.placeName,
      address: place.placeAddress,
      description: place.rawSerpApiPropertyDetails?.description,
      location: { lat: place.lat, lng: place.lng },
      types: place.categories,
      imageUrl: place.coverImageUrl || undefined,
      source: 'local',
      rating: place.averageRating || undefined,
      userRatingsTotal: place.reviewCount || undefined,
      amenities: place.rawSerpApiPropertyDetails?.amenities,
    }));
  }

  private takeRandomResults(results: PlaceResult[], limit: number): PlaceResult[] {
    const shuffled = [...results];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, Math.min(limit, shuffled.length));
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

  private normalizeTypes(type?: string, types?: string[]): string[] {
    const values = [
      ...(Array.isArray(types) ? types : []),
      ...(typeof type === 'string' ? type.split(',') : []),
    ]
      .map((value) => String(value).trim().toLowerCase())
      .filter(Boolean);

    return Array.from(new Set(values));
  }

  private buildProviderQuery(query?: string, typeFilters: string[] = [], location?: string): string {
    const trimmedQuery = query?.trim();
    if (trimmedQuery) return trimmedQuery;

    const providerParts = [
      typeFilters.join(' '),
      location?.trim(),
    ].filter(Boolean);

    return providerParts.length ? providerParts.join(' ') : 'lodging';
  }

  private shouldQueryExternalProviders(
    localResults: PlaceResult[],
    filters: SearchFilters,
    typeFilters: string[],
    policy: ExternalProviderPolicy,
  ): boolean {
    if (policy === 'never') return false;
    if (!this.providers.length) return false;
    if (policy === 'always') return true;
    if (localResults.length === 0) return true;

    const hasStructuredIntent = Boolean(typeFilters.length || filters.location || filters.latitude || filters.longitude);
    const minimumLocalResults = hasStructuredIntent ? 8 : 12;
    return localResults.length < minimumLocalResults;
  }
}
