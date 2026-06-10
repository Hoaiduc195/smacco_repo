import { Injectable } from '@nestjs/common';
import { IUnifiedTool, UnifiedToolInput, UnifiedToolOutput } from './tool.interface';
import { getPoint, normalizeAmenities, normalizePlaces } from './place-insight-utils';

@Injectable()
export class PlaceMetadataContextTool implements IUnifiedTool {
  readonly id = 'place_metadata_context';
  readonly description = 'Normalizes exactly one tagged place into stable metadata for place insight workflows.';

  async execute(inputs: UnifiedToolInput): Promise<UnifiedToolOutput> {
    const places = normalizePlaces(inputs.taggedPlaces || inputs.places || inputs.place);
    if (places.length !== 1) {
      return {
        status: 'success',
        data: {
          status: 'requires_exactly_one_place',
          taggedPlaceCount: places.length,
          message: 'Insight địa điểm chỉ áp dụng khi user tag đúng 1 địa điểm.',
        },
      };
    }

    const place = places[0];
    const placePoint = getPoint(place);

    return {
      status: 'success',
      data: {
        status: 'ok',
        place: {
          id: place.id || place.locationId,
          name: place.name || place.placeName || place.title,
          address: place.address || place.placeAddress || place.displayAddress,
          rating: place.rating || place.averageRating,
          reviewCount: place.reviewCount || place.reviewsCount || place.userRatingsTotal,
          price: place.price || place.priceRange || place.priceText || place.ratePerNight,
          amenities: normalizeAmenities(place).slice(0, 20),
          lat: placePoint?.lat,
          lng: placePoint?.lng,
        },
      },
    };
  }
}
