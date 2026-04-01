import apiClient from './api';

// Fetch recommendations from recommendation-service via gateway
export const getRecommendations = async ({ location, type, budget } = {}) => {
  const payload = {
    location: location || undefined,
    type: type || undefined,
    budget: budget || undefined,
  };

  try {
    const response = await apiClient.post('/recommendations/recommend', payload);
    return response.data?.results || [];
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    const message = error?.response?.data?.detail || error.message || 'Failed to load recommendations';
    throw new Error(message);
  }
};

export default {
  getRecommendations,
};
