const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

export const getRouteDetails = async (origin, destination) => {
  const url = `${OSRM_URL}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Không lấy được chỉ đường');
  const data = await resp.json();
  const route = data.routes?.[0];
  const coords = route?.geometry?.coordinates;
  if (!coords) throw new Error('Không có dữ liệu tuyến đường');

  return {
    coordinates: coords.map(([lng, lat]) => [lat, lng]),
    distanceMeters: route?.distance ?? null,
    durationSeconds: route?.duration ?? null,
  };
};

export const getRoute = async (origin, destination) => {
  const details = await getRouteDetails(origin, destination);
  return details.coordinates;
};

export default { getRoute, getRouteDetails };
