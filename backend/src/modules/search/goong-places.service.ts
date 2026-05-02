import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AccommodationProvider, PlaceResult, SearchParams } from './accommodation-provider.interface';

@Injectable()
export class GoongPlacesService implements AccommodationProvider {
  private readonly baseUrl = 'https://rsapi.goong.io/geocode';
  private readonly apiKey: string;
  private readonly logger = new Logger(GoongPlacesService.name);

  constructor(private readonly http: HttpService, private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOONG_API_KEY') || '';
  }

  async searchAccommodations(params: SearchParams): Promise<PlaceResult[]> {
    if (!this.apiKey) {
      this.logger.warn('GOONG_API_KEY is not configured. Skipping Goong API search.');
      return [];
    }

    const query = params.query?.trim() || params.type || 'hotel';

    try {
      const response = await this.http.axiosRef.get(this.baseUrl, {
        params: {
          api_key: this.apiKey,
          address: query,
        },
      });

      const items = response.data?.results || [];

      return items.map((r: any): PlaceResult => {
        // Goong geocode results usually have formatted_address and name
        const name = r.name || r.formatted_address?.split(',')[0] || 'Unknown Place';
        
        return {
          locationId: r.place_id || `goong-${Math.random().toString(36).substring(7)}`,
          name: name,
          address: r.formatted_address,
          location: r.geometry?.location ? { lat: Number(r.geometry.location.lat), lng: Number(r.geometry.location.lng) } : undefined,
          types: r.types || [],
        };
      });
    } catch (err: any) {
      this.logger.error(`Goong Search Error: ${err.message}`);
      return [];
    }
  }
}
