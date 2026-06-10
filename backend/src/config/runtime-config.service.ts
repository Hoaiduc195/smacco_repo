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

  get chat() {
    return this.config.chat;
  }

  get ai() {
    return this.config.ai;
  }
}
