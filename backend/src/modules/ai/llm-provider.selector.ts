import { AiProvider } from '../../config/runtime-config';

export function selectLlmClientByProvider<TGroqClient, TCloudflareClient, TFreemodelClient>(
  provider: AiProvider | undefined,
  groqClient: TGroqClient,
  cloudflareClient: TCloudflareClient,
  freemodelClient: TFreemodelClient,
): TGroqClient | TCloudflareClient | TFreemodelClient {
  if (provider === 'cloudflare') return cloudflareClient;
  if (provider === 'freemodel') return freemodelClient;
  return groqClient;
}
