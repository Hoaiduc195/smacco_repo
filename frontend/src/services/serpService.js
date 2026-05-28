import apiClient from './api';

export const fetchPlaceImage = async (placeId) => {
  if (!placeId) return null;

  try {
    const response = await apiClient.get(`/places/${placeId}/photos`);
    const photos = Array.isArray(response.data) ? response.data : [];
    return photos[0] || null;
  } catch (error) {
    console.error('Error fetching place image from backend:', error);
    return null;
  }
};

export default { fetchPlaceImage };
