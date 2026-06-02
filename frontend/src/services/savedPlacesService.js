import apiClient from './api';

export async function savePlace(placeId) {
  const response = await apiClient.post(`/saved-places/${placeId}`);
  return response.data;
}

export async function unsavePlace(placeId) {
  const response = await apiClient.delete(`/saved-places/${placeId}`);
  return response.data;
}

export async function checkSavedStatus(placeId) {
  const response = await apiClient.get(`/saved-places/check/${placeId}`);
  return response.data;
}

export async function getSavedPlaces() {
  const response = await apiClient.get('/saved-places');
  return response.data;
}
