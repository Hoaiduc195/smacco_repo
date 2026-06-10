import { registerAs } from '@nestjs/config';

export default registerAs('freemodel', () => ({
  apiKey: process.env.FREEMODEL_API_KEY || '',
  baseUrl: process.env.FREEMODEL_BASE_URL || 'https://api.freemodel.dev/v1',
  model: process.env.FREEMODEL_MODEL || 'gpt-4o-mini',
  timeout: process.env.FREEMODEL_TIMEOUT ? Number(process.env.FREEMODEL_TIMEOUT) : 20,
}));
