import { selectLlmClientByProvider } from './llm-provider.selector';

describe('selectLlmClientByProvider', () => {
  it('returns the Cloudflare client when runtime config selects cloudflare', () => {
    const groqClient = { name: 'groq' };
    const cloudflareClient = { name: 'cloudflare' };
    const openAiCompatibleClient = { name: 'openai-compatible' };
    const geminiClient = { name: 'gemini' };

    const selectedClient = selectLlmClientByProvider('cloudflare', groqClient, cloudflareClient, openAiCompatibleClient, geminiClient);

    expect(selectedClient).toBe(cloudflareClient);
  });

  it('returns the OpenAI-compatible client when runtime config selects openai-compatible', () => {
    const groqClient = { name: 'groq' };
    const cloudflareClient = { name: 'cloudflare' };
    const openAiCompatibleClient = { name: 'openai-compatible' };
    const geminiClient = { name: 'gemini' };

    const selectedClient = selectLlmClientByProvider('openai-compatible', groqClient, cloudflareClient, openAiCompatibleClient, geminiClient);

    expect(selectedClient).toBe(openAiCompatibleClient);
  });

  it('returns the Gemini client when runtime config selects gemini', () => {
    const groqClient = { name: 'groq' };
    const cloudflareClient = { name: 'cloudflare' };
    const openAiCompatibleClient = { name: 'openai-compatible' };
    const geminiClient = { name: 'gemini' };

    const selectedClient = selectLlmClientByProvider('gemini', groqClient, cloudflareClient, openAiCompatibleClient, geminiClient);

    expect(selectedClient).toBe(geminiClient);
  });

  it('falls back to the Groq client for unknown or missing providers', () => {
    const groqClient = { name: 'groq' };
    const cloudflareClient = { name: 'cloudflare' };
    const openAiCompatibleClient = { name: 'openai-compatible' };
    const geminiClient = { name: 'gemini' };

    expect(selectLlmClientByProvider('groq', groqClient, cloudflareClient, openAiCompatibleClient, geminiClient)).toBe(groqClient);
    expect(selectLlmClientByProvider(undefined, groqClient, cloudflareClient, openAiCompatibleClient, geminiClient)).toBe(groqClient);
  });
});
