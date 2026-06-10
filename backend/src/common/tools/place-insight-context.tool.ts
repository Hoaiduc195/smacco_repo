import { Injectable } from '@nestjs/common';
import { IUnifiedTool, UnifiedToolInput, UnifiedToolOutput } from './tool.interface';

@Injectable()
export class PlaceInsightContextTool implements IUnifiedTool {
  readonly id = 'place_insight_context';
  readonly description = 'Aggregates place metadata, start location, travel estimate, and nearby POI contexts for the final insight composer.';

  async execute(inputs: UnifiedToolInput): Promise<UnifiedToolOutput> {
    const metadata = inputs.metadata || {};
    const metadataData = metadata.data || metadata;

    if (metadataData?.status === 'requires_exactly_one_place') {
      return {
        status: 'success',
        data: metadataData,
      };
    }

    const startLocation = this.unwrapToolData(inputs.startLocation);
    const travel = this.unwrapToolData(inputs.travel);
    const nearby = this.unwrapToolData(inputs.nearby);

    return {
      status: 'success',
      data: {
        status: metadataData?.status || 'ok',
        place: metadataData?.place,
        requestedCriteria: inputs.criteria || [],
        tripPurposes: inputs.tripPurposes || [],
        startLocation: {
          label: startLocation?.label || 'Chưa có điểm xuất phát',
          lat: startLocation?.lat,
          lng: startLocation?.lng,
          source: startLocation?.source || 'missing',
        },
        travel: travel || {
          status: 'missing_coordinates',
          startLabel: startLocation?.label || 'Chưa có điểm xuất phát',
          reason: 'Thiếu dữ liệu di chuyển từ các tool trước đó.',
        },
        nearby: nearby || { status: 'missing_place_coordinates', items: [], categoryCounts: {} },
        evidenceNotes: [
          'Thời gian di chuyển là ước tính theo khoảng cách đường chim bay, không phải route giao thông thật.',
          nearby?.status === 'disabled'
            ? 'Dữ liệu địa danh xung quanh đang bị tắt trong cấu hình runtime.'
            : 'Địa danh xung quanh lấy từ OpenStreetMap/Overpass khi provider ngoài được bật.',
        ],
      },
    };
  }

  private unwrapToolData(value: any) {
    if (!value || typeof value !== 'object') return value;
    return value.data || value;
  }
}
