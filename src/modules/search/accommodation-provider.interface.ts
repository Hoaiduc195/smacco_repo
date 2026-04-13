import { LatLngLiteral } from '@googlemaps/google-maps-services-js';

export interface PlaceResult {
  locationId: string;
  name: string;
  address?: string;
  location?: LatLngLiteral;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  types?: string[];
  imageUrl?: string;
}

export interface SearchParams {
  query?: string;
  location?: LatLngLiteral;
  radius?: number;
  budget?: 'low' | 'mid' | 'high';
  latitude?: number;
  longitude?: number;
}

export interface AccommodationProvider {
  searchAccommodations(params: SearchParams): Promise<PlaceResult[]>;
}

export const ACCOMMODATION_PROVIDERS = 'ACCOMMODATION_PROVIDERS';
