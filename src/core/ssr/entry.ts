import 'reflect-metadata';
import '../polyfills/mutation-observer';
import { createSSRConfig, SSRConfig, defaultConfig } from './config.ts';
import { SSRPipeline, RenderContext, RenderResult } from './pipeline.ts';
import { makeSSRCompatible } from '../polyfills/component-ssr.ts';
import { JSDOM } from 'jsdom';
import { TypedRouterService } from '@/core/router/typed/router-service';
import { SauceContainer } from '@/core/injection/sauceContainer';

/**
 * Main entry point for server-side rendering
 * @param component The component to render
 * @param url The URL to render the component at
 * @param state Initial state to hydrate the component with
 * @param config SSR configuration
 * @returns Promise with rendered HTML, state, and headers
 */
export async function renderApp(
  component: any,
  url: string,
  state: Record<string, any> = {},
  config: Partial<SSRConfig> = {}
): Promise<RenderResult> {
  
  const mergedConfig: SSRConfig = {
    ...defaultConfig,
    ...config
  };

  console.log(`Rendering component ${component.name || 'Anonymous'} for SSR`);
  
  
  let componentToRender = component;
  if (typeof component === 'function') {
    componentToRender = makeSSRCompatible(component);
  }
  
  
  const pipeline = new SSRPipeline(mergedConfig);
  const context: RenderContext = {
    url,
    state,
    headers: { 'Content-Type': 'text/html' }
  };

  
  return pipeline.renderWithHydration(componentToRender, context);
}

export async function renderError(error: Error, url: string) {
  const config = createSSRConfig();
  const pipeline = new SSRPipeline(config);

  const context: RenderContext = {
    url,
    state: { error: error.message },
    headers: {}
  };

  return pipeline.renderWithHydration(
    {
      render: () => `
        <div class="error-page">
          <h1>Error</h1>
          <p>${error.message}</p>
          <button onclick="window.location.reload()">Retry</button>
        </div>
      `
    },
    context
  );
}



export const testComponent = {
  render: () => `
    <div>
      <h1>Test Component</h1>
      <p>This is a test component rendered through SSR</p>
    </div>
  `
};


export function runTestComponent() {
  renderApp(testComponent, '/')
    .then(html => {
      console.log('Rendered HTML:', html);
    })
    .catch(error => {
      console.error('Rendering failed:', error);
      process.exit(1);
    });
}

// Configurar el entorno del servidor
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
global.window = dom.window as any
global.document = dom.window.document
global.navigator = dom.window.navigator

// Importar polyfills necesarios
import '@/core/polyfills'

export async function renderToString(url: string): Promise<string> {
  const router = SauceContainer.resolve<TypedRouterService>('typed-router-service')
  
  if (!router) {
    throw new Error('Route not found')
  }

  const routeMatch = router.getCurrentRouteMatch()
  if (!routeMatch.route) {
    throw new Error('Route not found')
  }

  const component = document.createElement(routeMatch.route.component)
  const html = component.outerHTML

  return `<!DOCTYPE html>
    <html>
      <head>
        <title>SSR App</title>
        <script>
          window.__INITIAL_STATE__ = ${JSON.stringify(routeMatch.params)};
          window.__INITIAL_URL__ = "${url}";
        </script>
      </head>
      <body>
        <div id="app">${html}</div>
        <script type="module" src="/zodiac.js"></script>
        <script type="module" src="/main.js"></script>
      </body>
    </html>`
}