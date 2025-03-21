import '../polyfills';
import { Window, IDocument } from 'happy-dom';
import { TypedRouterService } from '@/core/router/typed/router-service.ts';
import { DirectiveManager } from '@/core/directives/directive-manager.ts';
import { SauceContainer } from '@/core/injection/sauceContainer.ts';

export interface SSRConfig {
  window: Window;
  document: IDocument;
  baseUrl: string;
  assetsDir: string;
  url?: string;
}

export const defaultConfig: SSRConfig = {
  window: new Window({
    url: 'http://localhost:3000'
  }),
  document: new Window({
    url: 'http://localhost:3000'
  }).document,
  baseUrl: '/',
  assetsDir: '/assets'
};

export function createSSRConfig(config: Partial<SSRConfig> = {}): SSRConfig {
  
  SauceContainer.register('typed-router-service', TypedRouterService);
  SauceContainer.register('directive-manager', DirectiveManager);

  return {
    ...defaultConfig,
    ...config
  };
} 