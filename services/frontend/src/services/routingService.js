const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

export const getRoute = async (origin, destination) => {
  const url = `${OSRM_URL}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Không lấy được chỉ đường');
  const data = await resp.json();
  const coords = data.routes?.[0]?.geometry?.coordinates;
  if (!coords) throw new Error('Không có dữ liệu tuyến đường');
  return coords.map(([lng, lat]) => [lat, lng]);
};

export default { getRoute };
