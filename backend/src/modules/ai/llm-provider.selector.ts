import { AiProvider } from '../../config/runtime-config';

export function selectLlmClientByProvider<TGroqClient, TCloudflareClient, TFreemodelClient, TGeminiClient>(
  provider: AiProvider | undefined,
  groqClient: TGroqClient,
  cloudflareClient: TCloudflareClient,
  freemodelClient: TFreemodelClient,
  geminiClient: TGeminiClient,
): TGroqClient | TCloudflareClient | TFreemodelClient | TGeminiClient {
  if (provider === 'cloudflare') return cloudflareClient;
  if (provider === 'freemodel') return freemodelClient;
  if (provider === 'gemini') return geminiClient;
  return groqClient;
}
