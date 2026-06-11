import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env file manually to load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index === -1) continue;
      const key = trimmed.substring(0, index).trim();
      let val = trimmed.substring(index + 1).trim();
      // Remove surrounding quotes if any
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  }
}

async function testR2() {
  console.log('\n--- Checking Cloudflare R2 Connection ---');
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    console.error('❌ R2 Credentials missing in .env');
    return false;
  }

  console.log(`Endpoint: https://${accountId}.r2.cloudflarestorage.com`);
  console.log(`Bucket: ${bucketName}`);

  const s3Client = new S3Client({
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    region: 'auto',
  });

  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 5,
    });
    const result = await s3Client.send(command);
    console.log('✅ R2 Connection Successful!');
    console.log(`Objects found in bucket: ${result.Contents ? result.Contents.length : 0}`);
    if (result.Contents) {
      console.log('Sample objects:');
      result.Contents.forEach((c) => console.log(` - ${c.Key} (${c.Size} bytes)`));
    }
    return true;
  } catch (error: any) {
    console.error('❌ R2 Connection Failed:', error.message);
    return false;
  }
}

async function testWorkersAI() {
  console.log('\n--- Checking Cloudflare Workers AI Connection ---');
  const accountId = process.env.CLOUDFLARE_AI_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_AI_API_TOKEN;
  const model = process.env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct';
  const useProxy = process.env.CLOUDFLARE_AI_USE_PROXY === 'true';
  const officialBaseUrl = process.env.CLOUDFLARE_AI_OFFICIAL_BASE_URL || 'https://api.cloudflare.com/client/v4/accounts';
  const proxyBaseUrl = process.env.CLOUDFLARE_AI_PROXY_BASE_URL || process.env.CLOUDFLARE_AI_BASE_URL || '';
  const baseUrl = useProxy && proxyBaseUrl
    ? proxyBaseUrl
    : `${officialBaseUrl.replace(/\/$/, '')}/${accountId}/ai/v1`;

  if (!accountId || !apiToken) {
    console.error('❌ Workers AI Credentials missing in .env');
    return false;
  }

  console.log(`Mode: ${useProxy ? 'proxy' : 'official'}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Model: ${model}`);

  const url = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;

  try {
    const response = await axios.post(
      url,
      {
        model: model,
        messages: [
          { role: 'user', content: 'Say hello in 5 words.' }
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log('✅ Workers AI Connection Successful!');
    const message = response.data?.choices?.[0]?.message;
    const content = message?.content || response.data?.result?.response;
    const reasoning = message?.reasoning_content || message?.reasoning;
    console.log(`AI Response: "${content?.trim() || '(empty content)'}"`);
    if (!content && reasoning) {
      console.log('Note: model returned reasoning content but no final message content.');
    }
    return true;
  } catch (error: any) {
    console.error('❌ Workers AI Connection Failed:', error.response?.data || error.message);
    return false;
  }
}

async function main() {
  loadEnv();
  const r2Ok = await testR2();
  const aiOk = await testWorkersAI();
  console.log('\n=======================================');
  console.log(`R2 Connection Status:          ${r2Ok ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Workers AI Connection Status:  ${aiOk ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log('=======================================\n');
}

main();
