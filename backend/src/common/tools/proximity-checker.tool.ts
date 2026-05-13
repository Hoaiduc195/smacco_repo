import { Injectable, Logger } from '@nestjs/common';
import { IUnifiedTool, UnifiedToolInput, UnifiedToolOutput } from './tool.interface';
import { distanceKm } from '../utils/geo.util';

@Injectable()
export class ProximityCheckerTool implements IUnifiedTool {
  private readonly logger = new Logger(ProximityCheckerTool.name);
  readonly id = 'proximity_checker';
  readonly description = 'Scores places by distance to an anchor location.';

  async execute(inputs: UnifiedToolInput): Promise<UnifiedToolOutput> {
    const places = inputs.places || [];
    const results: Record<string, any> = {};
    const anchorLocation = inputs.anchorLocation as { lat: number; lng: number } | undefined;
    const anchorLabel = inputs.anchorLabel as string | undefined;

    if (!anchorLocation) {
      for (const place of places) {
        results[place.locationId || place.id] = { score: 0.5, details: { reason: 'No anchor' } };
      }
      return { status: 'success', scoringMap: results };
    }

    for (const place of places) {
      const placeId = place.locationId || place.id;
      const lat = place.location?.lat ?? place.lat;
      const lng = place.location?.lng ?? place.lng;

      if (lat == null || lng == null) {
        results[placeId] = { score: 0.3, details: { reason: 'No coordinates' } };
        continue;
      }

      const distKm = distanceKm(anchorLocation.lat, anchorLocation.lng, lat, lng);
      const score = distKm <= 1 ? 1 : distKm <= 3 ? 0.8 : distKm <= 5 ? 0.6 : distKm <= 10 ? 0.4 : 0.2;

      results[placeId] = {
        score: Math.round(score * 1000) / 1000,
        details: { distanceKm: Math.round(distKm * 100) / 100, targetLabel: anchorLabel || 'unknown' },
      };
    }
    return { status: 'success', scoringMap: results };
  }
}
