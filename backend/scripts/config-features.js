const fs = require('fs');
const path = require('path');
const readline = require('readline');

const configPath = path.join(__dirname, '../features.json');

const TEST_PROFILE = {
  environment: 'test',
  search: {
    localDatabase: false,
    localFixture: true,
    externalProviders: false,
    externalProviderPolicy: 'never',
  },
  chat: {
    persistHistory: false,
  },
  externalApis: {
    serpapi: {
      hotelSearch: false,
      propertyDetails: false,
      photos: false,
      reviews: false,
    },
  },
  ai: {
    provider: 'groq',
  },
};

const PRODUCTION_PROFILE = {
  environment: 'production',
  search: {
    localDatabase: true,
    localFixture: false,
    externalProviders: true,
    externalProviderPolicy: 'fallback',
  },
  chat: {
    persistHistory: true,
  },
  externalApis: {
    serpapi: {
      hotelSearch: true,
      propertyDetails: true,
      photos: true,
      reviews: true,
    },
  },
  ai: {
    provider: 'groq',
  },
};

function readConfig() {
  if (!fs.existsSync(configPath)) return TEST_PROFILE;
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    return TEST_PROFILE;
  }
}

function askQuestion(rl, query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function mergeAiProvider(profile, current) {
  return {
    ...profile,
    ai: {
      ...profile.ai,
      provider: current?.ai?.provider || current?.aiProvider || profile.ai.provider,
    },
  };
}

async function main() {
  const current = readConfig();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('\n=============================================');
  console.log('           RUNTIME CONFIGURATION             ');
  console.log('=============================================');
  console.log('Choose a profile to separate test and production behavior.\n');
  console.log('1. test       - Fixture-only mock data, no database or external API calls');
  console.log('2. production - Production database + SerpAPI/Overpass, no local fixture');
  console.log(`\nCurrent profile: ${current.environment || current.mode || 'test'}\n`);

  const profileAnswer = (await askQuestion(rl, 'Select profile (test/production, press Enter to keep current): ')).trim().toLowerCase();
  let next = current;

  if (profileAnswer === 'test') {
    next = mergeAiProvider(TEST_PROFILE, current);
  } else if (profileAnswer === 'production') {
    next = mergeAiProvider(PRODUCTION_PROFILE, current);
  }

  const providerAnswer = (await askQuestion(rl, `AI provider (${next.ai?.provider || 'groq'})? (groq/cloudflare, press Enter to keep current): `)).trim().toLowerCase();
  if (providerAnswer === 'groq' || providerAnswer === 'cloudflare') {
    next.ai = { ...(next.ai || {}), provider: providerAnswer };
  }

  if (next.environment === 'production') {
    const persistAnswer = (await askQuestion(rl, `Persist chat history (${next.chat.persistHistory ? 'yes' : 'no'})? (yes/no, press Enter to keep current): `)).trim().toLowerCase();
    if (persistAnswer === 'yes') {
      next.chat.persistHistory = true;
    } else if (persistAnswer === 'no') {
      next.chat.persistHistory = false;
    }

    const policyAnswer = (await askQuestion(rl, `External provider policy (${next.search.externalProviderPolicy})? (fallback/always/never, press Enter to keep current): `)).trim().toLowerCase();
    if (['fallback', 'always', 'never'].includes(policyAnswer)) {
      next.search.externalProviderPolicy = policyAnswer;
      next.search.externalProviders = policyAnswer !== 'never';
    }
  }

  fs.writeFileSync(configPath, JSON.stringify(next, null, 2), 'utf8');
  console.log('\n[OK] Runtime configuration saved:');
  console.log(configPath);
  console.log(JSON.stringify(next, null, 2));
  console.log('=============================================\n');

  rl.close();
}

main().catch((err) => {
  console.error('Configuration error:', err);
});
