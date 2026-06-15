import { registerAs } from '@nestjs/config';

export default registerAs('openaiCompatible', () => ({
  apiKey: process.env.OPENAI_COMPATIBLE_API_KEY || process.env.FREEMODEL_API_KEY || '',
  baseUrl: process.env.OPENAI_COMPATIBLE_BASE_URL || process.env.FREEMODEL_BASE_URL || 'https://api.freemodel.dev/v1',
  model: process.env.OPENAI_COMPATIBLE_MODEL || process.env.FREEMODEL_MODEL || 'gpt-4o-mini',
  timeout: process.env.OPENAI_COMPATIBLE_TIMEOUT
    ? Number(process.env.OPENAI_COMPATIBLE_TIMEOUT)
    : (process.env.FREEMODEL_TIMEOUT ? Number(process.env.FREEMODEL_TIMEOUT) : 20),
}));
