import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AccommodationProvider, PlaceResult, SearchParams } from './accommodation-provider.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SerpApiHotelsService implements AccommodationProvider {
  private readonly baseUrl = 'https://serpapi.com/search';
  private readonly apiKey: string;
  private readonly logger = new Logger(SerpApiHotelsService.name);

  constructor(private readonly http: HttpService, private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SERPAPI_API_KEY') || '';
  }

  private getFeaturesConfig() {
    const configPath = path.join(process.cwd(), 'features.json');
    const defaults = { hotelSearch: true, photos: false, reviews: true, nearbyAmenities: true };
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf8');
        return { ...defaults, ...JSON.parse(content) };
      }
    } catch (err) {
      // ignore config loading errors and fallback
    }
    return defaults;
  }

  async searchAccommodations(params: SearchParams): Promise<PlaceResult[]> {
    const config = this.getFeaturesConfig();
    if (!config.hotelSearch) {
      this.logger.log('SerpAPI Hotel Search is disabled by configuration.');
      return [];
    }

    if (!this.apiKey) {
      this.logger.warn('SERPAPI_API_KEY is not configured. Skipping SerpAPI search.');
      return [];
    }

    const query = params.query?.trim() || 'hotel';
    const checkInDate = this.normalizeCheckInDate(params.checkInDate);
    const checkOutDate = this.normalizeCheckOutDate(params.checkOutDate, checkInDate);
    const location = params.locationName
      ? `${params.locationName}, Vietnam`
      : 'Vietnam';

    try {
      const response = await this.http.axiosRef.get(this.baseUrl, {
        params: {
          engine: 'google_hotels',
          q: query,
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          location,
          gl: 'vn',
          hl: 'vi',
          currency: 'VND',
          api_key: this.apiKey,
        },
      });

      const properties = response.data?.properties ?? [];

      return properties.map((p: any): PlaceResult => {
        const sourcePlaceId = this.resolveSourcePlaceId(p);
        const normalizedType = this.normalizePlaceType(p);
        const normalizedAddress = this.normalizeAddress(p);
        const price = p.rate_per_night?.lowest ?? p.total_rate?.lowest ?? p.price;
        const amenities = Array.isArray(p.amenities) ? p.amenities.map((a: any) => String(a)) : undefined;

        return {
          locationId: sourcePlaceId ? `serpapi-${sourcePlaceId}` : `serpapi-${Math.random().toString(36).slice(2)}`,
          sourcePlaceId,
          name: p.name || 'Unknown Hotel',
          address: normalizedAddress,
          description: typeof p.description === 'string' && p.description.trim() ? p.description.trim() : undefined,
          location: p.gps_coordinates
            ? {
                lat: Number(p.gps_coordinates.latitude),
                lng: Number(p.gps_coordinates.longitude),
              }
            : undefined,
          rating: typeof p.rating === 'number' ? p.rating : undefined,
          userRatingsTotal: typeof p.reviews === 'number' ? p.reviews : undefined,
          types: normalizedType ? [normalizedType] : undefined,
          imageUrl: p.thumbnail || undefined,
          source: 'serpapi',
          price: typeof price === 'string' && price.trim() ? price.trim() : undefined,
          amenities,
        };
      });
    } catch (err: any) {
      this.logger.error(`SerpAPI Search Error: ${err.message}`);
      return [];
    }
  }

  private resolveSourcePlaceId(property: any): string | undefined {
    const value = property?.property_token ?? property?.property_id ?? property?.id;
    return value ? String(value) : undefined;
  }

  private normalizePlaceType(property: any): string | undefined {
    const rawType = property?.type ?? property?.property_type;
    if (typeof rawType === 'string' && rawType.trim()) {
      return rawType.trim();
    }

    if (typeof property?.hotel_class === 'string' && property.hotel_class.toLowerCase().includes('hotel')) {
      return 'hotel';
    }

    return undefined;
  }

  private normalizeAddress(property: any): string | undefined {
    const candidates = [
      property?.address,
      property?.formatted_address,
      property?.full_address,
      property?.location,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }

    return undefined;
  }

  private normalizeCheckInDate(value?: string): string {
    if (value) return value;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.formatDate(tomorrow);
  }

  private normalizeCheckOutDate(value: string | undefined, checkInDate: string): string {
    if (value && value >= checkInDate) return value;
    const checkIn = this.parseDate(checkInDate);
    checkIn.setDate(checkIn.getDate() + 1);
    return this.formatDate(checkIn);
  }

  private parseDate(value: string): Date {
    const [year, month, day] = value.split('-').map((part) => Number(part));
    return new Date(year, month - 1, day);
  }

  private formatDate(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
