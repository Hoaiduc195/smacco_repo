import { Injectable } from '@nestjs/common';
import { readRuntimeConfig, RuntimeConfig } from './runtime-config';

@Injectable()
export class RuntimeConfigService {
  get config(): RuntimeConfig {
    return readRuntimeConfig();
  }

  get environment() {
    return this.config.environment;
  }

  get search() {
    return this.config.search;
  }

  get serpApi() {
    return this.config.externalApis.serpapi;
  }

  get overpass() {
    return this.config.externalApis.overpass;
  }

  get ai() {
    return this.config.ai;
  }
}
