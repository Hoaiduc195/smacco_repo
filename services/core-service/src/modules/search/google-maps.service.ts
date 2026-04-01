import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Language, LatLngLiteral } from '@googlemaps/google-maps-services-js';

export interface GooglePlace {
  locationId: string;
  name: string;
  address?: string;
  location?: LatLngLiteral;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  types?: string[];
}

export interface SearchParams {
  query?: string;
  location?: LatLngLiteral;
  radius?: number;
  budget?: 'low' | 'mid' | 'high';
}

const PRICE_BY_BUDGET: Record<string, number[]> = {
  low: [0, 1],
  mid: [2, 3],
  high: [4],
};

@Injectable()
export class GoogleMapsService {
  private readonly client: Client;
  private readonly apiKey: string;
  private readonly language: Language;
  private readonly region: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.client = new Client({});
    this.apiKey = this.configService.get<string>('google.apiKey') ?? '';
    this.language = (this.configService.get<string>('google.language') as Language) ?? 'vi';
    this.region = (this.configService.get<string>('google.region') || 'vn').toUpperCase();
    this.timeoutMs = this.configService.get<number>('google.timeoutMs') ?? 5000;
  }

  async searchAccommodations(params: SearchParams): Promise<GooglePlace[]> {
    if (!this.apiKey) {
      throw new BadRequestException('Google Maps API key is not configured');
    }

    const query = params.query?.trim() || 'lodging';
    const radius = params.radius ?? 5000; // meters

    try {
      const response = await this.client.textSearch({
        params: {
          key: this.apiKey,
          query,
          location: params.location,
          radius,
          language: this.language,
          region: this.region,
          // The SDK type enum names differ; using raw string keeps the request valid.
          type: 'lodging' as any,
        },
        timeout: this.timeoutMs,
      });

      const allowedPrices = params.budget ? PRICE_BY_BUDGET[params.budget] : undefined;

      return response.data.results
        .filter((r) =>
          allowedPrices ? (r.price_level !== undefined && allowedPrices.includes(r.price_level)) : true,
        )
        .map((r) => ({
          locationId: r.place_id ?? '',
          name: r.name ?? 'Unknown',
          address: r.formatted_address ?? r.vicinity,
          location: r.geometry?.location,
          rating: r.rating,
          userRatingsTotal: r.user_ratings_total,
          priceLevel: r.price_level,
          // SDK returns AddressType[]; stringify to align with our GooglePlace interface
          types: r.types?.map(String),
        }));
    } catch (err: any) {
      const message = err?.response?.data?.error_message || err.message || 'Google Maps search failed';
      throw new InternalServerErrorException(message);
    }
  }
}
