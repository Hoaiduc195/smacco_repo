import { registerAs } from '@nestjs/config';

export default registerAs('osm', () => ({
  baseUrl: process.env.OSM_BASE_URL || 'https://nominatim.openstreetmap.org/search',
  userAgent: process.env.OSM_USER_AGENT || 'core-service/1.0',
  language: process.env.OSM_LANGUAGE || 'vi',
  limit: process.env.OSM_LIMIT ? Number(process.env.OSM_LIMIT) : 15,
  timeoutMs: process.env.OSM_TIMEOUT_MS ? Number(process.env.OSM_TIMEOUT_MS) : 5000,
}));
