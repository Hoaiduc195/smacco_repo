import { distanceKm } from '../utils/geo.util';

export type GeoPoint = { lat: number; lng: number };

export function normalizePlaces(value: any): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [value].filter(Boolean);
}

export function getPoint(value: any): GeoPoint | null {
  if (!value || typeof value !== 'object') return null;
  const lat = Number(value.lat ?? value.latitude ?? value.location?.lat ?? value.coordinates?.lat);
  const lng = Number(value.lng ?? value.longitude ?? value.location?.lng ?? value.coordinates?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function resolveStartLabel(rawLabel: unknown, hasCustomStart: boolean, hasUserLocation: boolean): string {
  const label = typeof rawLabel === 'string' ? rawLabel.trim() : '';
  const isCurrentLocationLabel = /^(vị trí hiện tại|vi tri hien tai|current location)$/i.test(label);
  if (hasCustomStart && label && !isCurrentLocationLabel) return label;
  if (hasUserLocation) return 'Vị trí hiện tại';
  return label || 'Chưa có điểm xuất phát';
}

export function normalizeAmenities(place: any): string[] {
  const direct = Array.isArray(place?.amenities) ? place.amenities : [];
  const raw = place?.rawSerpApiPropertyDetails;
  const nested = raw && typeof raw === 'object' && Array.isArray(raw.amenities) ? raw.amenities : [];
  return [...direct, ...nested].map((item) => String(item || '').trim()).filter(Boolean);
}

export function roundDistanceKm(from: GeoPoint, to: GeoPoint): number {
  return Math.round(distanceKm(from.lat, from.lng, to.lat, to.lng) * 100) / 100;
}
