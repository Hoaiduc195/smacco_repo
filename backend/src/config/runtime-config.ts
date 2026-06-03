import * as fs from 'fs';
import * as path from 'path';

export type DataMode = 'test' | 'production';
export type ExternalProviderPolicy = 'never' | 'fallback' | 'always';
export type AiProvider = 'groq' | 'cloudflare';

export interface RuntimeConfig {
  environment: DataMode;
  search: {
    localDatabase: boolean;
    localFixture: boolean;
    externalProviders: boolean;
    externalProviderPolicy: ExternalProviderPolicy;
  };
  externalApis: {
    serpapi: {
      hotelSearch: boolean;
      propertyDetails: boolean;
      photos: boolean;
      reviews: boolean;
    };
    overpass: {
      nearbyAmenities: boolean;
    };
  };
  ai: {
    provider: AiProvider;
  };
}

const TEST_DEFAULTS: RuntimeConfig = {
  environment: 'test',
  search: {
    localDatabase: true,
    localFixture: true,
    externalProviders: false,
    externalProviderPolicy: 'never',
  },
  externalApis: {
    serpapi: {
      hotelSearch: false,
      propertyDetails: false,
      photos: false,
      reviews: false,
    },
    overpass: {
      nearbyAmenities: false,
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
    externalProviderPolicy: 'fallback',
  },
  externalApis: {
    serpapi: {
      hotelSearch: true,
      propertyDetails: true,
      photos: true,
      reviews: true,
    },
    overpass: {
      nearbyAmenities: true,
    },
  },
  ai: {
    provider: 'groq',
  },
};

function isProductionMode(raw: any): boolean {
  return raw?.environment === 'production' || raw?.mode === 'production' || raw?.dataMode === 'production';
}

function normalizeProvider(value: any): AiProvider {
  return value === 'cloudflare' ? 'cloudflare' : 'groq';
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

  const defaults = isProductionMode(raw) ? PRODUCTION_DEFAULTS : TEST_DEFAULTS;
  const legacySerpApi = definedBooleans({
    hotelSearch: raw.hotelSearch,
    propertyDetails: raw.propertyDetails,
    photos: raw.photos,
    reviews: raw.reviews,
  });

  const merged: RuntimeConfig = {
    environment: defaults.environment,
    search: {
      ...defaults.search,
      ...(raw.search || {}),
    },
    externalApis: {
      serpapi: {
        ...defaults.externalApis.serpapi,
        ...legacySerpApi,
        ...(raw.externalApis?.serpapi || {}),
      },
      overpass: {
        ...defaults.externalApis.overpass,
        nearbyAmenities: raw.nearbyAmenities ?? raw.externalApis?.overpass?.nearbyAmenities ?? defaults.externalApis.overpass.nearbyAmenities,
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

  return merged;
}
