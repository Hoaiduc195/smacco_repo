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
export const searchPlaces = async (query, lat, lng, limit = 20) => {
  try {
    // Try backend first
    const response = await apiClient.get('/places/search', {
      params: {
        q: query,
        lat,
        lng,
        limit,
      },
    });
    const data = response.data;

    // Normalize shape from multiple providers so SearchPage can always compute routes.
    const normalized = Array.isArray(data)
      ? data
      : (Array.isArray(data?.results) ? data.results : []);

    return normalized.map((item, index) => {
      const latValue = item.lat ?? item.latitude ?? item.location?.lat;
      const lngValue = item.lng ?? item.longitude ?? item.location?.lng;

      return {
        ...item,
        id: item.id || item.location_id || item.locationId || `place-${index}`,
        location_id: item.location_id || item.locationId || item.id || `place-${index}`,
        name: item.name || item.title || 'Địa điểm',
        address: item.address || item.formatted_address || item.vicinity || '',
        lat: latValue,
        lng: lngValue,
        latitude: item.latitude ?? latValue,
        longitude: item.longitude ?? lngValue,
        type: item.type || item.primaryType || item.category,
        rating: item.rating,
        imageUrl: item.imageUrl || item.image_url,
        priceLevel: item.priceLevel ?? item.price_level,
      };
    });
  } catch (error) {
    console.error('Backend search failed, using Nominatim:', error);
    // Fallback to Nominatim API for open-source search
    try {
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&limit=${limit}`
      );
      const data = await nominatimResponse.json();
      return data.map((item) => ({
        id: `nominatim-${item.osm_id}`,
        name: item.display_name.split(',')[0],
        address: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type,
      }));
    } catch (nominatimError) {
      console.error('Nominatim search also failed:', nominatimError);
      throw new Error('Không thể tìm kiếm địa điểm. Vui lòng thử lại.');
    }
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
  reverseGeocode,
  fetchNearbyPois,
};
