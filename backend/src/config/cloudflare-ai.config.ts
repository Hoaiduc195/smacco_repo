import { registerAs } from '@nestjs/config';

export default registerAs('cloudflareAi', () => ({
  accountId: process.env.CLOUDFLARE_AI_ACCOUNT_ID || '',
  apiToken: process.env.CLOUDFLARE_AI_API_TOKEN || '',
  model: process.env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct',
  baseUrl: process.env.CLOUDFLARE_AI_BASE_URL || 'https://api.cloudflare.com/client/v4/accounts',
  timeout: process.env.CLOUDFLARE_AI_TIMEOUT ? Number(process.env.CLOUDFLARE_AI_TIMEOUT) : 20,
}));
