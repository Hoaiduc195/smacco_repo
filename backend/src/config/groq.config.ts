import { registerAs } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export default registerAs('groq', () => {
  let provider = process.env.AI_PROVIDER || 'groq';
  try {
    const configPath = path.join(process.cwd(), 'features.json');
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);
      if (config.aiProvider) {
        provider = config.aiProvider;
      }
    }
  } catch (err) {
    // ignore config loading errors and fallback
  }

  return {
    apiKey: process.env.GROQ_API_KEY || '',
    baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
    timeout: process.env.GROQ_TIMEOUT ? Number(process.env.GROQ_TIMEOUT) : 20,
    streamingEnabled: process.env.GROQ_STREAMING_ENABLED !== 'false',
    provider,
  };
});
