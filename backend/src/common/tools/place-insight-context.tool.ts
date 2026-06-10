import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RuntimeConfigService } from '../../config/runtime-config.service';
import { distanceKm } from '../utils/geo.util';
import { IUnifiedTool, UnifiedToolInput, UnifiedToolOutput } from './tool.interface';

const OVERPASS_TIMEOUT = 15000;
const POI_RADIUS_METERS = 1500;
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

@Injectable()
export class PlaceInsightContextTool implements IUnifiedTool {
  private readonly logger = new Logger(PlaceInsightContextTool.name);
  readonly id = 'place_insight_context';
  readonly description = 'Builds deterministic context for one tagged place: distance/travel-time estimates and nearby landmarks/POIs.';

  constructor(
    private readonly httpService: HttpService,
    private readonly runtimeConfig: RuntimeConfigService,
  ) {}

  async execute(inputs: UnifiedToolInput): Promise<UnifiedToolOutput> {
    const places = this.normalizePlaces(inputs.taggedPlaces || inputs.places || inputs.place);
    if (places.length !== 1) {
      return {
        status: 'success',
        data: {
          status: 'requires_exactly_one_place',
          taggedPlaceCount: places.length,
          message: 'Insight địa điểm chỉ áp dụng khi user tag đúng 1 địa điểm.',
        },
      };
    }

    const place = places[0];
    const placePoint = this.getPoint(place);
    const userPoint = this.getPoint(inputs.userLocation);
    const geocodedStartPoint = this.getPoint(inputs.startLocation);
    const startPoint = geocodedStartPoint || userPoint;
    const startLabel = this.resolveStartLabel(inputs.startLocationLabel, Boolean(geocodedStartPoint), Boolean(userPoint));
    const travel = placePoint && startPoint
      ? this.buildTravelEstimate(startPoint, placePoint, startLabel)
      : {
        status: 'missing_coordinates',
        startLabel,
        reason: !placePoint ? 'Địa điểm thiếu tọa độ.' : 'Thiếu tọa độ điểm xuất phát.',
      };

    const nearby = placePoint
      ? await this.fetchNearbyPois(placePoint)
      : { status: 'missing_place_coordinates', items: [], categoryCounts: {} };

    return {
      status: 'success',
      data: {
        status: 'ok',
        place: {
          id: place.id || place.locationId,
          name: place.name || place.placeName || place.title,
          address: place.address || place.placeAddress || place.displayAddress,
          rating: place.rating || place.averageRating,
          reviewCount: place.reviewCount || place.reviewsCount || place.userRatingsTotal,
          price: place.price || place.priceRange || place.priceText || place.ratePerNight,
          amenities: this.normalizeAmenities(place).slice(0, 20),
          lat: placePoint?.lat,
          lng: placePoint?.lng,
        },
        requestedCriteria: inputs.criteria || [],
        tripPurposes: inputs.tripPurposes || [],
        startLocation: {
          label: startLabel,
          lat: startPoint?.lat,
          lng: startPoint?.lng,
          source: geocodedStartPoint ? 'custom_start_location' : userPoint ? 'current_user_location' : 'missing',
        },
        travel,
        nearby,
        evidenceNotes: [
          'Thời gian di chuyển là ước tính theo khoảng cách đường chim bay, không phải route giao thông thật.',
          nearby.status === 'disabled'
            ? 'Dữ liệu địa danh xung quanh đang bị tắt trong cấu hình runtime.'
            : 'Địa danh xung quanh lấy từ OpenStreetMap/Overpass khi provider ngoài được bật.',
        ],
      },
    };
  }

  private normalizePlaces(value: any): any[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    return [value].filter(Boolean);
  }

  private getPoint(value: any): { lat: number; lng: number } | null {
    if (!value || typeof value !== 'object') return null;
    const lat = Number(value.lat ?? value.latitude ?? value.location?.lat ?? value.coordinates?.lat);
    const lng = Number(value.lng ?? value.longitude ?? value.location?.lng ?? value.coordinates?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }

  private resolveStartLabel(rawLabel: unknown, hasCustomStart: boolean, hasUserLocation: boolean): string {
    const label = typeof rawLabel === 'string' ? rawLabel.trim() : '';
    const isCurrentLocationLabel = /^(vị trí hiện tại|vi tri hien tai|current location)$/i.test(label);
    if (hasCustomStart && label && !isCurrentLocationLabel) return label;
    if (hasUserLocation) return 'Vị trí hiện tại';
    return label || 'Chưa có điểm xuất phát';
  }

  private buildTravelEstimate(start: { lat: number; lng: number }, place: { lat: number; lng: number }, startLabel: string) {
    const straightLineKm = distanceKm(start.lat, start.lng, place.lat, place.lng);
    const adjustedRoadKm = straightLineKm * 1.25;
    const estimates = {
      walkingMinutes: Math.round((adjustedRoadKm / 4.5) * 60),
      motorbikeMinutes: Math.round((adjustedRoadKm / 24) * 60),
      carTaxiMinutes: Math.round((adjustedRoadKm / 22) * 60),
    };

    return {
      status: 'estimated',
      startLabel,
      straightLineDistanceKm: Math.round(straightLineKm * 100) / 100,
      estimatedRoadDistanceKm: Math.round(adjustedRoadKm * 100) / 100,
      estimates,
      interpretation: this.interpretTravelTime(estimates.carTaxiMinutes),
    };
  }

  private interpretTravelTime(carTaxiMinutes: number): string {
    if (carTaxiMinutes <= 10) return 'Rất gần, phù hợp di chuyển ngắn trong ngày.';
    if (carTaxiMinutes <= 25) return 'Khoảng cách thuận tiện, thường phù hợp làm điểm lưu trú hoặc ghé chơi.';
    if (carTaxiMinutes <= 45) return 'Cần tính thêm thời gian di chuyển, nhất là giờ cao điểm.';
    return 'Khá xa so với điểm xuất phát, nên cân nhắc lịch trình và phương tiện.';
  }

  private async fetchNearbyPois(place: { lat: number; lng: number }) {
    if (!this.runtimeConfig.overpass.nearbyAmenities) {
      return { status: 'disabled', items: [], categoryCounts: {} };
    }

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

  private normalizeAmenities(place: any): string[] {
    const direct = Array.isArray(place?.amenities) ? place.amenities : [];
    const raw = place?.rawSerpApiPropertyDetails;
    const nested = raw && typeof raw === 'object' && Array.isArray(raw.amenities) ? raw.amenities : [];
    return [...direct, ...nested].map((item) => String(item || '').trim()).filter(Boolean);
  }
}
