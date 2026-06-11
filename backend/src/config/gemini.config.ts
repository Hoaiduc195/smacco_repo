import { registerAs } from '@nestjs/config';

export default registerAs('gemini', () => ({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
  baseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
  model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  timeout: process.env.GEMINI_TIMEOUT ? Number(process.env.GEMINI_TIMEOUT) : 60,
}));
