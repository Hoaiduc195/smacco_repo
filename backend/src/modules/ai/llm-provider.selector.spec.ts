import { selectLlmClientByProvider } from './llm-provider.selector';

describe('selectLlmClientByProvider', () => {
  it('returns the Cloudflare client when runtime config selects cloudflare', () => {
    const groqClient = { name: 'groq' };
    const cloudflareClient = { name: 'cloudflare' };

    const selectedClient = selectLlmClientByProvider('cloudflare', groqClient, cloudflareClient);

    expect(selectedClient).toBe(cloudflareClient);
  });

  it('falls back to the Groq client for unknown or missing providers', () => {
    const groqClient = { name: 'groq' };
    const cloudflareClient = { name: 'cloudflare' };

    expect(selectLlmClientByProvider('groq', groqClient, cloudflareClient)).toBe(groqClient);
    expect(selectLlmClientByProvider(undefined, groqClient, cloudflareClient)).toBe(groqClient);
  });
});
