import * as fs from 'fs';
import * as path from 'path';

export type RuntimeEnvironment = 'development' | 'test' | 'production';
export type DataMode = RuntimeEnvironment;
export type ExternalProviderPolicy = 'never' | 'fallback' | 'always';
export type AiProvider = 'groq' | 'cloudflare' | 'openai-compatible' | 'gemini';

export interface RuntimeConfig {
  environment: RuntimeEnvironment;
  search: {
    localDatabase: boolean;
    localFixture: boolean;
    externalProviders: boolean;
    externalProviderPolicy: ExternalProviderPolicy;
  };
  presence: {
    strictCoordinateValidation: boolean;
    strictDistanceValidation: boolean;
  };
  chat: {
    persistHistory: boolean;
  };
  externalApis: {
    serpapi: {
      hotelSearch: boolean;
      propertyDetails: boolean;
      photos: boolean;
      reviews: boolean;
    };
  };
  ai: {
    provider: AiProvider;
  };
}

const TEST_DEFAULTS: RuntimeConfig = {
  environment: 'test',
  search: {
    localDatabase: false,
    localFixture: true,
    externalProviders: false,
    externalProviderPolicy: 'never',
  },
  presence: {
    strictCoordinateValidation: true,
    strictDistanceValidation: true,
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

const DEVELOPMENT_DEFAULTS: RuntimeConfig = {
  environment: 'development',
  search: {
    localDatabase: true,
    localFixture: true,
    externalProviders: false,
    externalProviderPolicy: 'never',
  },
  presence: {
    strictCoordinateValidation: false,
    strictDistanceValidation: false,
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

const PRODUCTION_DEFAULTS: RuntimeConfig = {
  environment: 'production',
  search: {
    localDatabase: true,
    localFixture: false,
    externalProviders: true,
    externalProviderPolicy: 'always',
  },
  presence: {
    strictCoordinateValidation: true,
    strictDistanceValidation: true,
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

function normalizeEnvironment(value: any): RuntimeEnvironment | null {
  if (value === 'development' || value === 'test' || value === 'production') return value;
  return null;
}

function resolveEnvironment(raw: any): RuntimeEnvironment {
  return normalizeEnvironment(raw?.environment)
    || normalizeEnvironment(raw?.mode)
    || normalizeEnvironment(raw?.dataMode)
    || 'test';
}

function getDefaults(environment: RuntimeEnvironment): RuntimeConfig {
  if (environment === 'production') return PRODUCTION_DEFAULTS;
  if (environment === 'development') return DEVELOPMENT_DEFAULTS;
  return TEST_DEFAULTS;
}

function normalizeProvider(value: any): AiProvider {
  if (value === 'cloudflare' || value === 'openai-compatible' || value === 'gemini') return value;
  if (value === 'freemodel') return 'openai-compatible';
  return 'groq';
}

function normalizePolicy(value: any): ExternalProviderPolicy {
  if (value === 'always' || value === 'never') return value;
  return 'fallback';
}

function definedBooleans(values: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => typeof value === 'boolean'),
  );
}

export function readRuntimeConfig(): RuntimeConfig {
  const configPath = path.join(process.cwd(), 'features.json');
  let raw: any = {};

  try {
    if (fs.existsSync(configPath)) {
      raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err) {
    raw = {};
  }

  const environment = resolveEnvironment(raw);
  const defaults = getDefaults(environment);
  const legacySerpApi = definedBooleans({
    hotelSearch: raw.hotelSearch,
    propertyDetails: raw.propertyDetails,
    photos: raw.photos,
    reviews: raw.reviews,
  });

  const merged: RuntimeConfig = {
    environment,
    search: {
      ...defaults.search,
      ...(raw.search || {}),
    },
    presence: {
      ...defaults.presence,
      ...(raw.presence || {}),
    },
    chat: {
      ...defaults.chat,
      ...(raw.chat || {}),
    },
    externalApis: {
      serpapi: {
        ...defaults.externalApis.serpapi,
        ...legacySerpApi,
        ...(raw.externalApis?.serpapi || {}),
      },
    },
    ai: {
      ...defaults.ai,
      ...(raw.ai || {}),
      provider: normalizeProvider(raw.ai?.provider || raw.aiProvider || process.env.AI_PROVIDER || defaults.ai.provider),
    },
  };

  merged.search.externalProviderPolicy = normalizePolicy(merged.search.externalProviderPolicy);
  if (!merged.search.externalProviders) {
    merged.search.externalProviderPolicy = 'never';
  }

  if (merged.environment === 'test') {
    merged.search = {
      localDatabase: false,
      localFixture: true,
      externalProviders: false,
      externalProviderPolicy: 'never',
    };
    merged.presence = {
      ...TEST_DEFAULTS.presence,
      ...(raw.presence || {}),
    };
    merged.chat = {
      persistHistory: false,
    };
    merged.externalApis = {
      serpapi: {
        hotelSearch: false,
        propertyDetails: false,
        photos: false,
        reviews: false,
      },
    };
  }

  return merged;
}
