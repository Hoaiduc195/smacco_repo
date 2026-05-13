import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AccommodationProvider, PlaceResult, SearchParams } from './accommodation-provider.interface';

@Injectable()
export class SerpApiHotelsService implements AccommodationProvider {
  private readonly baseUrl = 'https://serpapi.com/search.json';
  private readonly apiKey: string;
  private readonly logger = new Logger(SerpApiHotelsService.name);

  constructor(private readonly http: HttpService, private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SERPAPI_API_KEY') || '';
  }

  async searchAccommodations(params: SearchParams): Promise<PlaceResult[]> {
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

      return properties.map((p: any): PlaceResult => ({
        locationId: String(p.property_id ?? `serpapi-${Math.random().toString(36).slice(2)}`),
        sourcePlaceId: p.property_id ? String(p.property_id) : undefined,
        name: p.name || 'Unknown Hotel',
        address: p.address || p.location || undefined,
        location: p.gps_coordinates
          ? {
              lat: Number(p.gps_coordinates.latitude),
              lng: Number(p.gps_coordinates.longitude),
            }
          : undefined,
        rating: typeof p.rating === 'number' ? p.rating : undefined,
        userRatingsTotal: typeof p.reviews === 'number' ? p.reviews : undefined,
        imageUrl: p.thumbnail || undefined,
        source: 'serpapi',
      }));
    } catch (err: any) {
      this.logger.error(`SerpAPI Search Error: ${err.message}`);
      return [];
    }
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
