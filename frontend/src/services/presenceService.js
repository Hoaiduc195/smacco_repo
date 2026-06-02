import apiClient from './api';

export async function getMyOnsiteStatus() {
  const response = await apiClient.get('/presence/me');
  return response.data;
}

export async function checkInAtPlace(placeId, location) {
  const response = await apiClient.post('/presence/check-in', {
    placeId,
    latitude: location.lat,
    longitude: location.lng,
  });
  return response.data;
}

export async function leaveOnsiteStatus() {
  const response = await apiClient.delete('/presence/me');
  return response.data;
}