import apiClient from './api';

const poiCache = new Map();
const POI_FILTERS = {
  hotel: '["tourism"="hotel"]',
  resort: '["tourism"="resort"]',
  homestay: '["tourism"="guest_house"]',
  restaurant: '["amenity"="restaurant"]',
  cafe: '["amenity"="cafe"]',
};

/**
 * PlaceService handles all place-related API calls
 * This service manages data fetching from the backend and handles API errors
 */

// Search places using backend API or Nominatim for fallback
export const searchPlaces = async (query, filters = {}) => {
  try {
    const response = await apiClient.get('/search', {
      params: {
        q: query || undefined,
        type: filters.type || undefined,
        location: filters.locationInput || undefined,
        budget: filters.budget || undefined,
      },
    });
    
    // Transform backend PlaceResult to the expected frontend format
    return response.data.map(place => ({
      id: place.locationId,
      name: place.name,
      address: place.address,
      lat: place.location?.lat,
      lng: place.location?.lng,
      type: place.types?.[0] || 'default',
      rating: place.rating,
      priceLevel: place.priceLevel,
      source: place.source,
      sourcePlaceId: place.sourcePlaceId
    }));
  } catch (error) {
    console.error('Error searching places:', error);
    throw new Error('Không thể tìm kiếm địa điểm. Vui lòng thử lại.');
  }
};

// Get nearby places
export const getNearbyPlaces = async (lat, lng, radius = 1000, limit = 20) => {
  try {
    const response = await apiClient.get('/places/nearby', {
      params: {
        lat,
        lng,
        radius,
        limit,
      },
    });
    return response.data; // Returning nearby places data
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    throw new Error('Không thể tải địa điểm lân cận. Vui lòng thử lại.');
  }
};

// Get place details
export const getPlaceDetails = async (placeId) => {
  try {
    const response = await apiClient.get(`/places/${placeId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching place details:', error);
    throw new Error('Không thể tải thông tin địa điểm. Vui lòng thử lại.');
  }
};

// Get place reviews
export const getPlaceReviews = async (placeId) => {
  try {
    const response = await apiClient.get(`/places/${placeId}/reviews`);
    return response.data;
  } catch (error) {
    console.error('Error fetching place reviews:', error);
    return []; // Return empty array on error instead of failing
  }
};

// Get user reviews
export const getUserReviews = async (userId) => {
  try {
    const response = await apiClient.get('/reviews', {
      params: { userId },
    });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return [];
  }
};

// Reverse geocoding - get place info from coordinates
export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    return {
      address: data.address?.road || data.display_name,
      city: data.address?.city || data.address?.town,
      country: data.address?.country,
    };
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return null;
  }
};

// Fetch nearby POIs directly from Overpass to enrich the map layer
export const fetchNearbyPois = async (lat, lng, radius = 1500, categories = ['hotel', 'resort', 'homestay', 'restaurant', 'cafe']) => {
  if (!lat || !lng) return [];
  const normalizedCategories = categories.filter((c) => POI_FILTERS[c]);
  if (!normalizedCategories.length) return [];

  const cacheKey = `${lat.toFixed(3)}:${lng.toFixed(3)}:${radius}:${normalizedCategories.join(',')}`;
  if (poiCache.has(cacheKey)) return poiCache.get(cacheKey);

  const query = `[out:json][timeout:25];(${normalizedCategories
    .map((cat) => `node${POI_FILTERS[cat]}(around:${radius},${lat},${lng});`)
    .join('')});out center;`;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: query,
    });
    const data = await response.json();

    const pois = data.elements
      .filter((el) => el.lat || el.center)
      .map((el) => {
        const category = normalizedCategories.find((cat) => {
          const filter = POI_FILTERS[cat];
          return filter.includes('"tourism"')
            ? el.tags?.tourism && filter.includes(el.tags.tourism)
            : el.tags?.amenity && filter.includes(el.tags.amenity);
        });
        return {
          id: `poi-${el.id}`,
          name: el.tags?.name || 'POI',
          address: el.tags?.['addr:full'] || el.tags?.['addr:street'] || el.tags?.['addr:city'],
          lat: el.lat || el.center?.lat,
          lng: el.lon || el.center?.lon,
          category: category || 'default',
        };
      })
      .filter((poi) => poi.lat && poi.lng);

    poiCache.set(cacheKey, pois);
    return pois;
  } catch (error) {
    console.error('Error fetching POIs from Overpass:', error);
    return [];
  }
};

export default {
  searchPlaces,
  getNearbyPlaces,
  getPlaceDetails,
  getPlaceReviews,
  getUserReviews,
  reverseGeocode,
  fetchNearbyPois,
};
