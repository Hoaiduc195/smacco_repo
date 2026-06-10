import { selectLlmClientByProvider } from './llm-provider.selector';

describe('selectLlmClientByProvider', () => {
  it('returns the Cloudflare client when runtime config selects cloudflare', () => {
    const groqClient = { name: 'groq' };
    const cloudflareClient = { name: 'cloudflare' };
    const freemodelClient = { name: 'freemodel' };

    const selectedClient = selectLlmClientByProvider('cloudflare', groqClient, cloudflareClient, freemodelClient);

    expect(selectedClient).toBe(cloudflareClient);
  });

  it('returns the Freemodel client when runtime config selects freemodel', () => {
    const groqClient = { name: 'groq' };
    const cloudflareClient = { name: 'cloudflare' };
    const freemodelClient = { name: 'freemodel' };

    const selectedClient = selectLlmClientByProvider('freemodel', groqClient, cloudflareClient, freemodelClient);

    expect(selectedClient).toBe(freemodelClient);
  });

  it('falls back to the Groq client for unknown or missing providers', () => {
    const groqClient = { name: 'groq' };
    const cloudflareClient = { name: 'cloudflare' };
    const freemodelClient = { name: 'freemodel' };

    expect(selectLlmClientByProvider('groq', groqClient, cloudflareClient, freemodelClient)).toBe(groqClient);
    expect(selectLlmClientByProvider(undefined, groqClient, cloudflareClient, freemodelClient)).toBe(groqClient);
  });
});
