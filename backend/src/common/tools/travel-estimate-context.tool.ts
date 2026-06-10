import { Injectable } from '@nestjs/common';
import { distanceKm } from '../utils/geo.util';
import { IUnifiedTool, UnifiedToolInput, UnifiedToolOutput } from './tool.interface';
import { getPoint } from './place-insight-utils';

@Injectable()
export class TravelEstimateContextTool implements IUnifiedTool {
  readonly id = 'travel_estimate_context';
  readonly description = 'Estimates distance and travel time from a resolved start location to one tagged place.';

  async execute(inputs: UnifiedToolInput): Promise<UnifiedToolOutput> {
    const placePoint = getPoint(inputs.place || inputs.placeMetadata?.place || inputs.placeMetadata);
    const startPoint = getPoint(inputs.startLocation);
    const startLabel = typeof inputs.startLocation?.label === 'string' ? inputs.startLocation.label : 'Chưa có điểm xuất phát';

    if (!placePoint || !startPoint) {
      return {
        status: 'success',
        data: {
          status: 'missing_coordinates',
          startLabel,
          reason: !placePoint ? 'Địa điểm thiếu tọa độ.' : 'Thiếu tọa độ điểm xuất phát.',
        },
      };
    }

    const straightLineKm = distanceKm(startPoint.lat, startPoint.lng, placePoint.lat, placePoint.lng);
    const adjustedRoadKm = straightLineKm * 1.25;
    const estimates = {
      walkingMinutes: Math.round((adjustedRoadKm / 4.5) * 60),
      motorbikeMinutes: Math.round((adjustedRoadKm / 24) * 60),
      carTaxiMinutes: Math.round((adjustedRoadKm / 22) * 60),
    };

    return {
      status: 'success',
      data: {
        status: 'estimated',
        startLabel,
        straightLineDistanceKm: Math.round(straightLineKm * 100) / 100,
        estimatedRoadDistanceKm: Math.round(adjustedRoadKm * 100) / 100,
        estimates,
        interpretation: this.interpretTravelTime(estimates.carTaxiMinutes),
      },
    };
  }

  private interpretTravelTime(carTaxiMinutes: number): string {
    if (carTaxiMinutes <= 10) return 'Rất gần, phù hợp di chuyển ngắn trong ngày.';
    if (carTaxiMinutes <= 25) return 'Khoảng cách thuận tiện, thường phù hợp làm điểm lưu trú hoặc ghé chơi.';
    if (carTaxiMinutes <= 45) return 'Cần tính thêm thời gian di chuyển, nhất là giờ cao điểm.';
    return 'Khá xa so với điểm xuất phát, nên cân nhắc lịch trình và phương tiện.';
  }
}
