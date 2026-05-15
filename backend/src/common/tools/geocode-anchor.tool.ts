import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { IUnifiedTool, UnifiedToolInput, UnifiedToolOutput } from './tool.interface';

@Injectable()
export class GeocodeAnchorTool implements IUnifiedTool {
  readonly id = 'geocode_anchor';
  readonly description = 'Geocodes a landmark or place name using Goong. Detects POI/category queries and biases search by the provided location filter.';
  private readonly logger = new Logger(GeocodeAnchorTool.name);
  private readonly baseUrl = 'https://rsapi.goong.io/geocode';

  constructor(private readonly http: HttpService, private readonly configService: ConfigService) {}

  async execute(inputs: UnifiedToolInput): Promise<UnifiedToolOutput> {
    const rawQuery = typeof inputs.query === 'string' ? inputs.query.trim() : '';
    if (!rawQuery) return { status: 'success', data: null };

    const apiKey = this.configService.get<string>('GOONG_API_KEY') || '';
    if (!apiKey) {
      this.logger.warn('GOONG_API_KEY is not configured. Skipping geocode.');
      return { status: 'success', data: null };
    }

    const location = typeof inputs.location === 'string' ? inputs.location.trim() : '';

    const POI_KEYWORDS = [
      // Vietnamese common POI/category words
      'cửa hàng', 'cửa hàng tiện lợi', 'bệnh viện', 'nhà thuốc', 'trạm xăng', 'trạm cấp cứu',
      'quán ăn', 'nhà hàng', 'khách sạn', 'homestay', 'villa', 'nhà nghỉ', 'khách sạn', 'quán cà phê',
      'siêu thị', 'công viên', 'trường', 'chợ', 'bến xe', 'sân bay', 'ga tàu',
      // English equivalents
      'gas station', 'hospital', 'pharmacy', 'restaurant', 'hotel', 'guest house', 'store', 'shop', 'convenience store',
      'supermarket', 'park', 'school', 'market', 'airport', 'station'
    ];

    const PROXIMITY_WORDS = [
      'gần', 'gần nhất', 'gần với', 'ở gần', 'xung quanh', 'trong bán kính', 'cách',
      'near', 'nearby', 'nearest', 'closest', 'around', 'next to', 'by', 'close to', 'within'
    ];

    const normalizeQuery = (q: string) => q
      .replace(/^gần\s+/i, '')
      .replace(/^near\s+/i, '')
      .replace(/^nearby\s+/i, '')
      .replace(/^(closest|nearest)\s+/i, '')
      .replace(/^around\s+/i, '')
      .trim();

    const isPoiQuery = (q: string) => {
      const lower = q.toLowerCase();

      // If contains explicit proximity words (Vietnamese or English)
      if (PROXIMITY_WORDS.some(w => lower.includes(w))) return true;

      // If contains distance expressions like 'cách 500m', 'trong bán kính 1km', 'within 500m'
      const distanceRegex = /\b(cách|trong bán kính)\s*\d+\s*(m|km|mét)\b|\bwithin\s*\d+\s*(m|km)\b/i;
      if (distanceRegex.test(q)) return true;

      // If query mentions known POI keywords
      if (POI_KEYWORDS.some(k => lower.includes(k))) return true;

      return false;
    };

    // If query looks like a POI/category or mentions 'gần', prefer a place-style search
    const cleaned = normalizeQuery(rawQuery);
    const usePoiSearch = isPoiQuery(rawQuery) || isPoiQuery(cleaned);

    const address = location ? `${cleaned}, ${location}` : cleaned;

    try {
      const response = await this.http.axiosRef.get(this.baseUrl, {
        params: {
          api_key: apiKey,
          address,
        },
      });

      const first = response.data?.results?.[0];
      if (!first?.geometry?.location) {
        // If we expected POI and got no result, try fallback with rawQuery
        if (usePoiSearch && cleaned !== rawQuery) {
          const fallbackResp = await this.http.axiosRef.get(this.baseUrl, {
            params: { api_key: apiKey, address: rawQuery }
          });
          const fbFirst = fallbackResp.data?.results?.[0];
          if (fbFirst?.geometry?.location) {
            const labelFb = fbFirst.name || fbFirst.formatted_address || rawQuery;
            return {
              status: 'success',
              data: { label: labelFb, location: { lat: Number(fbFirst.geometry.location.lat), lng: Number(fbFirst.geometry.location.lng) } }
            };
          }
        }
        return { status: 'success', data: null };
      }

      const label = first.name || first.formatted_address || cleaned;
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
