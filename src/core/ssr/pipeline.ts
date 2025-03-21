import { SauceContainer } from '@/core/injection/sauceContainer.ts';
import { ThemeService } from '@/test/services/theme-service.ts';
import { SSR } from '../render/ssr.ts';
import { SSRConfig } from './config.ts';

export interface RenderContext {
  url: string;
  state: Record<string, any>;
  headers: Record<string, string>;
}

export interface RenderResult {
  html: string;
  state: Record<string, any>;
  headers: Record<string, string>;
}

export class SSRPipeline {
  // @ts-ignore
  private config: SSRConfig;

  constructor(config: SSRConfig) {
    this.config = config;
  }

  private async initializeServices() {
    try {
      
      if (!SauceContainer.isRegistered('theme-service')) {
        console.log('SSR: Registering theme-service');
        SauceContainer.register('theme-service', ThemeService);
      }
      
      
      await SauceContainer.resolve('theme-service');
      await SauceContainer.resolve('typed-router-service');
      await SauceContainer.resolve('directive-manager');
    } catch (error) {
      console.warn('SSR: Failed to initialize services:', error);
    }
  }

  
  private findRenderMethod(instance: any): string | null {
    const proto = Object.getPrototypeOf(instance);
    const descriptors = Object.getOwnPropertyDescriptors(proto);
    
    
    
    for (const [methodName, descriptor] of Object.entries(descriptors)) {
      
      if (methodName === 'constructor' || typeof descriptor.value !== 'function') {
        continue;
      }
      
      
      if (methodName === 'render') {
        return methodName;
      }
      
      
      
      const fnStr = descriptor.value.toString();
      if (fnStr.includes('shadowRoot.innerHTML') || 
          fnStr.includes('this.root.innerHTML') ||
          fnStr.includes('this.shadowRoot.innerHTML')) {
        return methodName;
      }
    }
    
    return null;
  }

  async render(component: any, context: RenderContext): Promise<RenderResult> {
    try {
      
      await this.initializeServices();

      let instance: any;
      
      
      if (typeof component === 'function') {
        
        console.log(`SSR Pipeline: Creating instance of ${component.name || 'Anonymous Component'}`);
        instance = new component();
        
        
        if (instance.shadowRoot && !instance.shadowRoot.addEventListener) {
          instance.shadowRoot.addEventListener = (type: string, listener: Function) => {
            console.log(`SSR: Adding event listener for ${type} to shadowRoot`);
            instance.addEventListener(type, listener);
          };
          
          instance.shadowRoot.removeEventListener = (type: string, listener: Function) => {
            instance.removeEventListener(type, listener);
          };
        }
        
      } else if (typeof component === 'object' && (component.render || component.shadowRoot)) {
        
        instance = component;
      } else {
        throw new Error('Invalid component: must be a class constructor or an object with a render method');
      }
      
      
      if (context.state) {
        Object.assign(instance, context.state);
      }

      
      if (!instance.shadowRoot) {
        console.log('SSR Pipeline: Attaching shadow root');
        instance.eventHandlers = instance.eventHandlers || new Map();
        
        
        if (!instance.addEventListener) {
          instance.addEventListener = function(type: string, listener: Function): void {
            console.log(`SSR: Adding event listener for ${type}`);
            if (!this.eventHandlers.has(type)) {
              this.eventHandlers.set(type, []);
            }
            this.eventHandlers.get(type)!.push(listener);
          };
          
          instance.removeEventListener = function(type: string, listener: Function): void {
            if (!this.eventHandlers.has(type)) return;
            
            const listeners = this.eventHandlers.get(type)!;
            const index = listeners.indexOf(listener);
            if (index !== -1) {
              listeners.splice(index, 1);
            }
            
            if (listeners.length === 0) {
              this.eventHandlers.delete(type);
            }
          };
        }
        
        
        instance.attachShadow = instance.attachShadow || function(this: any, options: { mode: string }) {
          this.shadowRoot = {
            mode: options.mode || 'open',
            innerHTML: '',
            addEventListener: (type: string, listener: Function) => {
              console.log(`SSR: Adding event listener for ${type} to shadowRoot`);
              this.addEventListener(type, listener);
            },
            removeEventListener: (type: string, listener: Function) => {
              this.removeEventListener(type, listener);
            }
          };
          return this.shadowRoot;
        };
        
        instance.attachShadow({ mode: 'open' });
      }

      
      if (typeof instance.connectedCallback === 'function') {
        console.log('SSR Pipeline: Calling connectedCallback');
        await instance.connectedCallback();
        
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const proto = Object.getPrototypeOf(instance);
      console.log('SSR Pipeline: Available methods:', Object.getOwnPropertyNames(proto)
        .filter(name => typeof instance[name] === 'function' && name !== 'constructor')
        .join(', '));

      
      if (typeof instance.initializeComponent === 'function') {
        console.log('SSR Pipeline: Calling initializeComponent');
        await instance.initializeComponent();
      }

      
      if (typeof instance.render === 'function') {
        console.log('SSR Pipeline: Calling render method');
        const rendered = instance.render();
        if (instance.shadowRoot && rendered && typeof rendered === 'string') {
          instance.shadowRoot.innerHTML = rendered;
        }
      } else {
        
        const renderMethodName = this.findRenderMethod(instance);
        
        if (renderMethodName) {
          console.log(`SSR Pipeline: Found render method: ${renderMethodName}`);
          try {
            
            const result = instance[renderMethodName]();
            
            
            if (!instance.shadowRoot.innerHTML && typeof result === 'string') {
              
              instance.shadowRoot.innerHTML = result;
            }
          } catch (err) {
            console.error('SSR: Error executing render method:', err);
          }
        } else if (instance.shadowRoot && !instance.shadowRoot.innerHTML) {
          
          console.log('SSR: Trying to find a method that populates shadowRoot...');
          const protoMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(instance));
          for (const method of protoMethods) {
            if (method !== 'constructor' && typeof instance[method] === 'function') {
              try {
                
                instance[method]();
                if (instance.shadowRoot && instance.shadowRoot.innerHTML) {
                  console.log(`SSR: Method ${method} populated shadowRoot`);
                  break; 
                }
              } catch (e) {
                
              }
            }
          }
        }
      }

      
      if (instance.shadowRoot && instance.shadowRoot.innerHTML) {
        console.log(`SSR Pipeline: ShadowRoot content length: ${instance.shadowRoot.innerHTML.length} chars`);
      } else {
        console.log('SSR Pipeline: No content in shadowRoot');
      }

      const html = await SSR.renderToString(instance);
      
      return {
        html,
        state: context.state,
        headers: context.headers
      };
    } catch (error) {
      console.error('SSR rendering failed:', error);
      throw error;
    }
  }

  async renderWithHydration(component: any, context: RenderContext): Promise<RenderResult> {
    const result = await this.render(component, context);
    
    const hydrationScript = `
      <script>
        window.__INITIAL_STATE__ = ${JSON.stringify(result.state)};
      </script>
    `;

    return {
      ...result,
      html: result.html.replace('</head>', `${hydrationScript}</head>`)
    };
  }
} 