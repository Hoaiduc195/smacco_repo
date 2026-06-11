import axios from 'axios';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const index = trimmed.indexOf('=');
    if (index === -1) continue;

    const key = trimmed.substring(0, index).trim();
    let value = trimmed.substring(index + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.substring(1, value.length - 1);
    } else {
      value = value.replace(/\s+#.*$/, '').trim();
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function getArgValue(name: string) {
  const prefix = `${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length).trim() : undefined;
}

function maskSecret(value: string | undefined) {
  if (!value) return '(missing)';
  if (value.length <= 10) return `${value.slice(0, 2)}...${value.slice(-2)}`;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function summarize(value: any, maxLength = 1200) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  if (!text) return '(empty)';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

async function collectStream(stream: any, maxBytes = 10000): Promise<string> {
  let output = '';
  for await (const chunk of stream) {
    output += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
    if (output.length >= maxBytes) break;
  }
  return output;
}

function extractContent(response: any) {
  return response?.choices?.[0]?.message?.content
    || response?.choices?.[0]?.text
    || response?.content
    || response?.text
    || response?.result?.response
    || response?.answer
    || '';
}

function extractStreamContent(raw: string) {
  const parts: string[] = [];
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;

    const payload = trimmed.replace(/^data:\s*/, '').trim();
    if (!payload || payload === '[DONE]') continue;

    try {
      const parsed = JSON.parse(payload);
      const delta = parsed?.choices?.[0]?.delta?.content
        || parsed?.choices?.[0]?.message?.content
        || parsed?.choices?.[0]?.text
        || parsed?.delta
        || parsed?.content
        || parsed?.text
        || '';
      if (delta) parts.push(delta);
    } catch {
      parts.push(payload);
    }
  }

  return parts.join('');
}

async function testModels(baseUrl: string, apiKey: string, timeout: number) {
  console.log('\n--- Freemodel models request ---');
  const response = await axios.get(
    `${baseUrl}/models`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      timeout,
      validateStatus: () => true,
    },
  );

  console.log(`HTTP status: ${response.status} ${response.statusText}`);
  if (response.status >= 400) {
    console.log('Error body:');
    console.log(summarize(response.data));
    return false;
  }

  const models = Array.isArray(response.data?.data) ? response.data.data.map((item: any) => item?.id).filter(Boolean) : [];
  console.log(`Models: ${models.join(', ') || '(none)'}`);
  return true;
}

async function testNonStreaming(url: string, apiKey: string, model: string, timeout: number) {
  console.log('\n--- Freemodel non-streaming request ---');
  const response = await axios.post(
    url,
    {
      model,
      messages: [{ role: 'user', content: 'Say hello in Vietnamese in one short sentence.' }],
      stream: false,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout,
      validateStatus: () => true,
    },
  );

  console.log(`HTTP status: ${response.status} ${response.statusText}`);
  console.log(`Response content-type: ${response.headers?.['content-type'] || '(none)'}`);

  if (response.status >= 400) {
    console.log('Error body:');
    console.log(summarize(response.data));
    return false;
  }

  console.log('Response keys:', Object.keys(response.data || {}).join(', ') || '(none)');
  console.log(`Content: ${extractContent(response.data).trim() || '(empty content)'}`);
  return true;
}

async function testStreaming(url: string, apiKey: string, model: string, timeout: number) {
  console.log('\n--- Freemodel streaming request ---');
  const response = await axios.post(
    url,
    {
      model,
      messages: [{ role: 'user', content: 'Say hello in Vietnamese in one short sentence.' }],
      stream: true,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      responseType: 'stream',
      timeout,
      validateStatus: () => true,
    },
  );

  console.log(`HTTP status: ${response.status} ${response.statusText}`);
  console.log(`Response content-type: ${response.headers?.['content-type'] || '(none)'}`);

  const raw = await collectStream(response.data);
  if (response.status >= 400) {
    console.log('Error body:');
    console.log(summarize(raw));
    return false;
  }

  console.log(`Stream content: ${extractStreamContent(raw).trim() || '(empty content)'}`);
  console.log('Raw stream preview:');
  console.log(summarize(raw, 1600));
  return true;
}

async function testOpenAiSdk(baseUrl: string, apiKey: string, model: string, timeout: number) {
  console.log('\n--- Freemodel OpenAI SDK request ---');
  const client = new OpenAI({ apiKey, baseURL: baseUrl, timeout });

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'Say hello in Vietnamese in one short sentence.' }],
      stream: false,
    });
    const content = response.choices?.[0]?.message?.content || '';
    console.log('SDK status: SUCCESS');
    console.log(`SDK content: ${content.trim() || '(empty content)'}`);
    return true;
  } catch (error: any) {
    console.log('SDK status: FAILED');
    console.log(`SDK error status: ${error.status || '(none)'}`);
    console.log(`SDK error message: ${error.message || '(none)'}`);
    console.log(`SDK error body: ${summarize(error.error || error.body || error.response?.data || '')}`);
    return false;
  }
}

async function main() {
  loadEnv();

  const apiKey = process.env.FREEMODEL_API_KEY || '';
  const baseUrl = (getArgValue('--base-url') || process.env.FREEMODEL_BASE_URL || 'https://api.freemodel.dev/v1').replace(/\/$/, '');
  const model = getArgValue('--model') || process.env.FREEMODEL_MODEL || 'gpt-4o-mini';
  const timeout = Number(process.env.FREEMODEL_TIMEOUT || 20) * 1000;
  const url = `${baseUrl}/chat/completions`;

  console.log('--- Freemodel diagnostic config ---');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Endpoint: ${url}`);
  console.log(`Model: ${model}`);
  console.log(`Timeout: ${timeout}ms`);
  console.log(`API key: ${maskSecret(apiKey)}`);

  if (!apiKey) {
    console.error('Missing FREEMODEL_API_KEY.');
    process.exitCode = 1;
    return;
  }

  try {
    const modelsOk = await testModels(baseUrl, apiKey, timeout);
    const nonStreamOk = await testNonStreaming(url, apiKey, model, timeout);
    const streamOk = await testStreaming(url, apiKey, model, timeout);
    const sdkOk = await testOpenAiSdk(baseUrl, apiKey, model, timeout);

    console.log('\n=======================================');
    console.log(`Freemodel models status:     ${modelsOk ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Freemodel non-stream status: ${nonStreamOk ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Freemodel stream status:     ${streamOk ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Freemodel SDK status:        ${sdkOk ? 'SUCCESS' : 'FAILED'}`);
    console.log('=======================================\n');

    process.exitCode = modelsOk && nonStreamOk && streamOk && sdkOk ? 0 : 1;
  } catch (error: any) {
    console.error('Freemodel diagnostic crashed:');
    console.error(error.response?.data || error.message || error);
    process.exitCode = 1;
  }
}

main();
