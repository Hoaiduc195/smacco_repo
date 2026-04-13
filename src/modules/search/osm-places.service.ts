import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { AccommodationProvider, PlaceResult, SearchParams } from './accommodation-provider.interface';

@Injectable()
export class OsmPlacesService implements AccommodationProvider {
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly language: string;
  private readonly limit: number;
  private readonly timeoutMs: number;

  constructor(private readonly http: HttpService, private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('osm.baseUrl') ?? 'https://nominatim.openstreetmap.org/search';
    this.userAgent = this.configService.get<string>('osm.userAgent') ?? 'core-service/1.0';
    this.language = this.configService.get<string>('osm.language') ?? 'vi';
    this.limit = this.configService.get<number>('osm.limit') ?? 15;
    this.timeoutMs = this.configService.get<number>('osm.timeoutMs') ?? 5000;
  }

  async searchAccommodations(params: SearchParams): Promise<PlaceResult[]> {
    const query = params.query?.trim() || 'hotel';

    const searchParams: any = {
      q: query,
      format: 'json',
      addressdetails: 1,
      extratags: 1,
      limit: this.limit,
      'accept-language': this.language,
    };

    if (params.latitude && params.longitude) {
      const delta = 0.1;
      searchParams.viewbox = `${params.longitude - delta},${params.latitude + delta},${params.longitude + delta},${params.latitude - delta}`;
      searchParams.bounded = 1;
    }

    const request: AxiosRequestConfig = {
      url: this.baseUrl,
      method: 'GET',
      params: searchParams,
      headers: { 'User-Agent': this.userAgent },
      timeout: this.timeoutMs,
    };

    try {
      const response = await this.http.axiosRef.request(request);
      const items = Array.isArray(response.data) ? response.data : [];

      return items.map((r: any): PlaceResult => {
        const shortName = r.address?.hotel || r.address?.name || r.address?.tourism || r.display_name.split(',')[0];

        const wikiPhoto = r.extratags?.wikidata
          ? `https://hub.toolforge.org/P18?id=${r.extratags.wikidata}&width=500`
          : undefined;

        return {
          locationId: String(r.place_id ?? r.osm_id ?? ''),
          name: shortName,
          address: r.display_name,
          location: r.lat && r.lon ? { lat: Number(r.lat), lng: Number(r.lon) } : undefined,
          types: r.type ? [String(r.type)] : undefined,
          imageUrl: wikiPhoto,
        };
      });
    } catch (err: any) {
      console.error('OSM Search Error:', err.message);
      return [];
    }
  }
}
