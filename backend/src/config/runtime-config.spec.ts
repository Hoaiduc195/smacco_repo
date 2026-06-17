import * as fs from 'fs';
import { readRuntimeConfig } from './runtime-config';

function mockFeatures(raw: Record<string, any>) {
  jest.spyOn(fs, 'existsSync').mockReturnValue(true);
  jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(raw) as any);
}

describe('readRuntimeConfig', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.AI_PROVIDER;
  });

  it('supports an explicit development profile with relaxed presence validation', () => {
    mockFeatures({ environment: 'development' });

    expect(readRuntimeConfig()).toMatchObject({
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
    });
  });

  it('keeps test mode normalized to fixture-only behavior', () => {
    mockFeatures({
      environment: 'test',
      search: {
        localDatabase: true,
        localFixture: false,
        externalProviders: true,
        externalProviderPolicy: 'always',
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
    });

    expect(readRuntimeConfig()).toMatchObject({
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
    });
  });
});
