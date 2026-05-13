import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { ITool, ToolInput, ToolOutput } from './tool.interface';

@Injectable()
export class GeocodeAnchorTool implements ITool {
  readonly id = 'geocode_anchor';
  readonly description = 'Geocodes a landmark or place name using Goong.';
  private readonly logger = new Logger(GeocodeAnchorTool.name);
  private readonly baseUrl = 'https://rsapi.goong.io/geocode';

  constructor(private readonly http: HttpService, private readonly configService: ConfigService) {}

  async execute(inputs: ToolInput): Promise<ToolOutput> {
    const query = typeof inputs.query === 'string' ? inputs.query.trim() : '';
    if (!query) {
      return { status: 'success', data: null };
    }

    const apiKey = this.configService.get<string>('GOONG_API_KEY') || '';
    if (!apiKey) {
      this.logger.warn('GOONG_API_KEY is not configured. Skipping geocode.');
      return { status: 'success', data: null };
    }

    const location = typeof inputs.location === 'string' ? inputs.location.trim() : '';
    const address = location ? `${query}, ${location}` : query;

    try {
      const response = await this.http.axiosRef.get(this.baseUrl, {
        params: {
          api_key: apiKey,
          address,
        },
      });

      const first = response.data?.results?.[0];
      if (!first?.geometry?.location) {
        return { status: 'success', data: null };
      }

      const label = first.name || first.formatted_address || query;
      return {
        status: 'success',
        data: {
          label,
          location: {
            lat: Number(first.geometry.location.lat),
            lng: Number(first.geometry.location.lng),
          },
        },
      };
    } catch (error: any) {
      this.logger.error(`Goong geocode error: ${error.message}`);
      return { status: 'error', error: error.message || 'Failed to geocode anchor' };
    }
  }
}
