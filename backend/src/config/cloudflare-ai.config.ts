import { registerAs } from '@nestjs/config';

export default registerAs('cloudflareAi', () => ({
  accountId: process.env.CLOUDFLARE_AI_ACCOUNT_ID || '',
  apiToken: process.env.CLOUDFLARE_AI_API_TOKEN || '',
  model: process.env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct',
  baseUrl: process.env.CLOUDFLARE_AI_OFFICIAL_BASE_URL || 'https://api.cloudflare.com/client/v4/accounts',
  useProxy: process.env.CLOUDFLARE_AI_USE_PROXY === 'true',
  proxyBaseUrl: process.env.CLOUDFLARE_AI_PROXY_BASE_URL || process.env.CLOUDFLARE_AI_BASE_URL || '',
  timeout: process.env.CLOUDFLARE_AI_TIMEOUT ? Number(process.env.CLOUDFLARE_AI_TIMEOUT) : 60,
}));
