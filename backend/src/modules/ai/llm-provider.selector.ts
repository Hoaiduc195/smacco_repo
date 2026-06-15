import { AiProvider } from '../../config/runtime-config';

export function selectLlmClientByProvider<TGroqClient, TCloudflareClient, TOpenAiCompatibleClient, TGeminiClient>(
  provider: AiProvider | undefined,
  groqClient: TGroqClient,
  cloudflareClient: TCloudflareClient,
  openAiCompatibleClient: TOpenAiCompatibleClient,
  geminiClient: TGeminiClient,
): TGroqClient | TCloudflareClient | TOpenAiCompatibleClient | TGeminiClient {
  if (provider === 'cloudflare') return cloudflareClient;
  if (provider === 'openai-compatible') return openAiCompatibleClient;
  if (provider === 'gemini') return geminiClient;
  return groqClient;
}
