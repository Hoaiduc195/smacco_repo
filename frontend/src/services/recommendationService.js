import apiClient from './api';

// Fetch recommendations from recommendation-service via gateway
export const getRecommendations = async ({ query, location, type, budget, radius } = {}) => {
  const payload = {
    query: query || undefined,
    location: location || undefined,
    type: type || undefined,
    budget: budget || undefined,
    radius: radius || undefined,
  };

  try {
    const response = await apiClient.post('/recommendations/recommend', payload);
    const results = response.data?.results || [];
    
    // Normalize results to ensure lat/lng are always present and formatted
    return results.map(item => ({
      ...item,
      id: item.id || item.location_id || item.locationId,
      lat: Number(item.lat ?? item.latitude),
      lng: Number(item.lng ?? item.longitude),
    }));
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    const message = error?.response?.data?.detail || error.message || 'Failed to load recommendations';
    throw new Error(message);
  }
};

export default {
  getRecommendations,
};
