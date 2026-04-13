import { registerAs } from '@nestjs/config';

export default registerAs('google', () => ({
  apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  language: process.env.GOOGLE_MAPS_LANGUAGE || 'vi',
  region: process.env.GOOGLE_MAPS_REGION || 'vn',
  timeoutMs: process.env.GOOGLE_MAPS_TIMEOUT_MS
    ? Number(process.env.GOOGLE_MAPS_TIMEOUT_MS)
    : 5000,
}));
