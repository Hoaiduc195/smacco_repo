import apiClient from './api';

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
    return response.data;
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
      throw new Error('Could not search places. Please try again.');
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
    return response.data;
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    throw new Error('Could not load nearby places. Please try again.');
  }
};

// Get place details
export const getPlaceDetails = async (placeId) => {
  try {
    const response = await apiClient.get(`/places/${placeId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching place details:', error);
    throw new Error('Could not load place details. Please try again.');
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

export default {
  searchPlaces,
  getNearbyPlaces,
  getPlaceDetails,
  getPlaceReviews,
  reverseGeocode,
};
