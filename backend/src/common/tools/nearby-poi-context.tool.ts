import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { distanceKm } from '../utils/geo.util';
import { IUnifiedTool, UnifiedToolInput, UnifiedToolOutput } from './tool.interface';
import { getPoint } from './place-insight-utils';

const OVERPASS_TIMEOUT = 15000;
const POI_RADIUS_METERS = 1500;
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

@Injectable()
export class NearbyPoiContextTool implements IUnifiedTool {
  private readonly logger = new Logger(NearbyPoiContextTool.name);
  readonly id = 'nearby_poi_context';
  readonly description = 'Fetches nearby attractions, landmarks, restaurants, cafes, and open spaces for one place.';

  constructor(
    private readonly httpService: HttpService,
  ) {}

  async execute(inputs: UnifiedToolInput): Promise<UnifiedToolOutput> {
    const placePoint = getPoint(inputs.place || inputs.placeMetadata?.place || inputs.placeMetadata);
    if (!placePoint) {
      return { status: 'success', data: { status: 'missing_place_coordinates', items: [], categoryCounts: {} } };
    }

    const nearby = await this.fetchNearbyPois(placePoint);
    return { status: 'success', data: nearby };
  }

  private async fetchNearbyPois(place: { lat: number; lng: number }) {
    const query = `[out:json][timeout:25];(
  node["tourism"~"attraction|museum|viewpoint|gallery|zoo|theme_park"](around:${POI_RADIUS_METERS},${place.lat},${place.lng});
  way["tourism"~"attraction|museum|viewpoint|gallery|zoo|theme_park"](around:${POI_RADIUS_METERS},${place.lat},${place.lng});
  node["historic"](around:${POI_RADIUS_METERS},${place.lat},${place.lng});
  way["historic"](around:${POI_RADIUS_METERS},${place.lat},${place.lng});
  node["amenity"~"restaurant|cafe|bar|fast_food|marketplace"](around:${POI_RADIUS_METERS},${place.lat},${place.lng});
  node["leisure"~"park|garden"](around:${POI_RADIUS_METERS},${place.lat},${place.lng});
);out center tags;`;

    try {
      let response: any = null;
      for (const endpoint of OVERPASS_ENDPOINTS) {
        try {
          response = await firstValueFrom(
            this.httpService.post(endpoint, `data=${encodeURIComponent(query)}`, {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
                'User-Agent': 'AccommodationDiscovery/1.0 (student-project)',
              },
              timeout: OVERPASS_TIMEOUT,
            }),
          );
          break;
        } catch (err: any) {
          this.logger.warn(`Overpass endpoint ${endpoint} failed for insight (${err.response?.status || err.message}), trying next...`);
        }
      }

      if (!response) throw new Error('All Overpass endpoints failed');

      const seen = new Set<string>();
      const items = (response.data?.elements || [])
        .map((element: any) => this.normalizePoi(element, place))
        .filter((poi: any) => {
          if (!poi?.name) return false;
          const key = `${poi.name}:${poi.category}`.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a: any, b: any) => a.distanceKm - b.distanceKm)
        .slice(0, 16);

      const categoryCounts = items.reduce((acc: Record<string, number>, item: any) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {});

      return { status: 'success', radiusMeters: POI_RADIUS_METERS, items, categoryCounts };
    } catch (error: any) {
      this.logger.warn(`Unable to fetch nearby insight POIs: ${error.message}`);
      return { status: 'error', error: error.message, items: [], categoryCounts: {} };
    }
  }

  private normalizePoi(element: any, place: { lat: number; lng: number }) {
    const tags = element.tags || {};
    const lat = Number(element.lat ?? element.center?.lat);
    const lng = Number(element.lon ?? element.center?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return {
      name: tags.name || tags['name:vi'] || tags['name:en'],
      category: this.resolvePoiCategory(tags),
      distanceKm: Math.round(distanceKm(place.lat, place.lng, lat, lng) * 100) / 100,
    };
  }

  private resolvePoiCategory(tags: Record<string, any>): string {
    if (tags.tourism) return `tourism:${tags.tourism}`;
    if (tags.historic) return `historic:${tags.historic}`;
    if (tags.amenity) return `amenity:${tags.amenity}`;
    if (tags.leisure) return `leisure:${tags.leisure}`;
    return 'other';
  }
}
