import { Injectable } from '@nestjs/common';
import { IUnifiedTool, UnifiedToolInput, UnifiedToolOutput } from './tool.interface';
import { getPoint, resolveStartLabel } from './place-insight-utils';

@Injectable()
export class ResolveStartLocationContextTool implements IUnifiedTool {
  readonly id = 'resolve_start_location_context';
  readonly description = 'Resolves the insight start location from custom geocode output or current user coordinates.';

  async execute(inputs: UnifiedToolInput): Promise<UnifiedToolOutput> {
    const userPoint = getPoint(inputs.userLocation);
    const geocodedStartPoint = getPoint(inputs.startLocation);
    const startPoint = geocodedStartPoint || userPoint;
    const startLabel = resolveStartLabel(inputs.startLocationLabel, Boolean(geocodedStartPoint), Boolean(userPoint));

    return {
      status: 'success',
      data: {
        status: startPoint ? 'ok' : 'missing_coordinates',
        label: startLabel,
        lat: startPoint?.lat,
        lng: startPoint?.lng,
        source: geocodedStartPoint ? 'custom_start_location' : userPoint ? 'current_user_location' : 'missing',
      },
    };
  }
}
