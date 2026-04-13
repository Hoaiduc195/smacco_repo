import { registerAs } from '@nestjs/config';

export default registerAs('groq', () => ({
  apiKey: process.env.GROQ_API_KEY || '',
  baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
  model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
  timeout: process.env.GROQ_TIMEOUT ? Number(process.env.GROQ_TIMEOUT) : 20,
  streamingEnabled: process.env.GROQ_STREAMING_ENABLED !== 'false',
}));
