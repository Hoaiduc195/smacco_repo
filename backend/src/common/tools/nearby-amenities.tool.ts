import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IUnifiedTool, UnifiedToolInput, UnifiedToolOutput } from './tool.interface';
import { distanceKm } from '../utils/geo.util';

const AMENITY_CATEGORIES = [
  'restaurant', 'cafe', 'supermarket', 'convenience_store',
  'atm', 'bank', 'pharmacy', 'hospital', 'clinic',
  'bus_station', 'parking', 'park', 'fast_food',
];

const OVERPASS_TIMEOUT = 15000;
const SEARCH_RADIUS = 500;

@Injectable()
export class NearbyAmenitiesTool implements IUnifiedTool {
  private readonly logger = new Logger(NearbyAmenitiesTool.name);
  readonly id = 'nearby_amenities';
  readonly description = 'Counts nearby POIs (restaurants, cafes, ATMs, etc.) for each place via Overpass API.';

  constructor(private readonly httpService: HttpService) {}

  async execute(inputs: UnifiedToolInput): Promise<UnifiedToolOutput> {
    const places = inputs.places || [];
    const results: Record<string, any> = {};
    const validPlaces = places.filter((p: any) => {
      const lat = p.location?.lat ?? p.lat;
      const lng = p.location?.lng ?? p.lng;
      return lat != null && lng != null;
    });

    if (validPlaces.length === 0) return { status: 'success', scoringMap: results };

    const amenityRegex = AMENITY_CATEGORIES.join('|');
    const aroundClauses = validPlaces.map((p: any) => {
      const lat = p.location?.lat ?? p.lat;
      const lng = p.location?.lng ?? p.lng;
      return `  node["amenity"~"${amenityRegex}"](around:${SEARCH_RADIUS},${lat},${lng});`;
    }).join('\n');

    const overpassQuery = `[out:json][timeout:25];(\n${aroundClauses}\n);out center;`;

    const OVERPASS_ENDPOINTS = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
    ];

    try {
      let response: any = null;
      for (const endpoint of OVERPASS_ENDPOINTS) {
        try {
          response = await firstValueFrom(
            this.httpService.post(endpoint, `data=${encodeURIComponent(overpassQuery)}`, {
              headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'User-Agent': 'AccommodationDiscovery/1.0 (student-project)',
              },
              timeout: OVERPASS_TIMEOUT,
            })
          );
          break; // success, stop trying
        } catch (err: any) {
          this.logger.warn(`Overpass endpoint ${endpoint} failed (${err.response?.status || err.message}), trying next...`);
        }
      }

      if (!response) throw new Error('All Overpass endpoints failed');

      const elements: any[] = response.data?.elements || [];

      for (const place of validPlaces) {
        const placeId = place.locationId || place.id;
        const lat = place.location?.lat ?? place.lat;
        const lng = place.location?.lng ?? place.lng;

        const nearby = elements.filter((el: any) => {
          if (!el.lat && !el.center) return false;
          const elLat = el.lat || el.center?.lat;
          const elLng = el.lon || el.center?.lon;
          return elLat && elLng && distanceKm(lat, lng, elLat, elLng) <= (SEARCH_RADIUS / 1000);
        });

        const categoryCounts: Record<string, number> = {};
        for (const el of nearby) {
          const amenity = el.tags?.amenity || 'unknown';
          categoryCounts[amenity] = (categoryCounts[amenity] || 0) + 1;
        }

        const categoryCount = Object.keys(categoryCounts).length;
        const totalCount = nearby.length;
        const varietyScore = Math.min(categoryCount / 5, 1);
        const densityScore = Math.min(totalCount / 10, 1);
        const score = Math.round((0.6 * varietyScore + 0.4 * densityScore) * 1000) / 1000;

        results[placeId] = {
          score,
          details: { totalAmenities: totalCount, categoryCount, categories: categoryCounts },
        };
      }
    } catch (error: any) {
      this.logger.warn(`Overpass API failed: ${error.message}`);
      for (const place of validPlaces) {
        results[place.locationId || place.id] = { score: 0.5, details: { error: error.message } };
      }
    }

    return { status: 'success', scoringMap: results };
  }


}
