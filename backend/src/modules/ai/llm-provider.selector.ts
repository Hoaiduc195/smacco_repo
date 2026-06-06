import { AiProvider } from '../../config/runtime-config';

export function selectLlmClientByProvider<TGroqClient, TCloudflareClient>(
  provider: AiProvider | undefined,
  groqClient: TGroqClient,
  cloudflareClient: TCloudflareClient,
): TGroqClient | TCloudflareClient {
  return provider === 'cloudflare' ? cloudflareClient : groqClient;
}
