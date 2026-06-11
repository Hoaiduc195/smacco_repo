import { selectLlmClientByProvider } from './llm-provider.selector';

describe('selectLlmClientByProvider', () => {
  it('returns the Cloudflare client when runtime config selects cloudflare', () => {
    const groqClient = { name: 'groq' };
    const cloudflareClient = { name: 'cloudflare' };
    const freemodelClient = { name: 'freemodel' };
    const geminiClient = { name: 'gemini' };

    const selectedClient = selectLlmClientByProvider('cloudflare', groqClient, cloudflareClient, freemodelClient, geminiClient);

    expect(selectedClient).toBe(cloudflareClient);
  });

  it('returns the Freemodel client when runtime config selects freemodel', () => {
    const groqClient = { name: 'groq' };
    const cloudflareClient = { name: 'cloudflare' };
    const freemodelClient = { name: 'freemodel' };
    const geminiClient = { name: 'gemini' };

    const selectedClient = selectLlmClientByProvider('freemodel', groqClient, cloudflareClient, freemodelClient, geminiClient);

    expect(selectedClient).toBe(freemodelClient);
  });

  it('returns the Gemini client when runtime config selects gemini', () => {
    const groqClient = { name: 'groq' };
    const cloudflareClient = { name: 'cloudflare' };
    const freemodelClient = { name: 'freemodel' };
    const geminiClient = { name: 'gemini' };

    const selectedClient = selectLlmClientByProvider('gemini', groqClient, cloudflareClient, freemodelClient, geminiClient);

    expect(selectedClient).toBe(geminiClient);
  });

  it('falls back to the Groq client for unknown or missing providers', () => {
    const groqClient = { name: 'groq' };
    const cloudflareClient = { name: 'cloudflare' };
    const freemodelClient = { name: 'freemodel' };
    const geminiClient = { name: 'gemini' };

    expect(selectLlmClientByProvider('groq', groqClient, cloudflareClient, freemodelClient, geminiClient)).toBe(groqClient);
    expect(selectLlmClientByProvider(undefined, groqClient, cloudflareClient, freemodelClient, geminiClient)).toBe(groqClient);
  });
});
