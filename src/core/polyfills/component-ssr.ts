export class BaseComponentSSR {
  public root: any;
  public shadowRoot: any;
  public eventHandlers: Map<string, Function[]> = new Map();
  public initialized = false;
  
  constructor(_useShadow: boolean = false) {
    
    this.shadowRoot = {
      mode: 'open',
      innerHTML: '',
      addEventListener: this.addEventListener.bind(this),
      removeEventListener: this.removeEventListener.bind(this)
    };
    this.root = this.shadowRoot;
  }
  
  
  attachShadow({ mode }: { mode: string }) {
    this.shadowRoot = { 
      mode, 
      innerHTML: '',
      addEventListener: this.addEventListener.bind(this),
      removeEventListener: this.removeEventListener.bind(this)
    };
    this.root = this.shadowRoot;
    return this.shadowRoot;
  }
  
  
  addEventListener(type: string, listener: Function): void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, []);
    }
    this.eventHandlers.get(type)!.push(listener);
    console.log(`SSR: Added event listener for ${type}`);
  }
  
  removeEventListener(type: string, listener: Function): void {
    if (!this.eventHandlers.has(type)) return;
    
    const listeners = this.eventHandlers.get(type)!;
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
    
    if (listeners.length === 0) {
      this.eventHandlers.delete(type);
    }
  }
  
  delegateEvent(eventName: string, selector: string, _handler: Function): void {
    const wrappedHandler = (_event: any) => {
      
      console.log(`SSR: Would delegate ${eventName} to ${selector}`);
    };
    
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    
    this.eventHandlers.get(eventName)?.push(wrappedHandler);
    this.addEventListener(eventName, wrappedHandler);
  }
  
  
  async injectDependencies() {
    console.log("SSR: injectDependencies called");
    try {
      
      const { SauceContainer } = await import('@/core/injection/sauceContainer.ts');
      
      const constructor = this.constructor as any;
      const injectionPromises: Promise<void>[] = [];
  
      if (constructor.__injections__) {
        for (const injection of constructor.__injections__) {
          const { propertyKey, token } = injection;
          injectionPromises.push(
            (async () => {
              try {
                console.log(`SSR: Injecting ${token} into ${propertyKey}`);
                const descriptor = Object.getOwnPropertyDescriptor(
                  this,
                  propertyKey
                );
                if (descriptor?.get && !descriptor.set) {
                  void (this as any)[propertyKey];
                  return;
                }
  
                const dependency = await Promise.resolve(
                  SauceContainer.resolve(token)
                );
                if (dependency) {
                  (this as any)[propertyKey] = dependency;
                } else {
                  console.warn(`SSR: Dependency not found for token: ${token}`);
                }
              } catch (error) {
                console.warn(
                  `SSR: Error injecting dependency from decorator: ${token}`,
                  error
                );
              }
            })()
          );
        }
      }
  
      await Promise.all(injectionPromises);
    } catch (error) {
      console.error("SSR: Error in injectDependencies", error);
    }
  }
  
  
  async connectedCallback() {
    if (!this.initialized) {
      await this.injectDependencies();
      this.initialized = true;
    }
  }
  
  disconnectedCallback() {
    this.eventHandlers.clear();
  }
  
  
  querySelector() { return null; }
  querySelectorAll() { return []; }
  
  
  render() {
    return '<div>Base SSR Component</div>';
  }
}


export function makeSSRCompatible(ComponentClass: any): any {
  console.log(`Making SSR compatible: ${ComponentClass.name || 'Anonymous Component'}`);
  
  try {
    
    const originalName = ComponentClass.name || 'AnonymousComponent';
    const originalTagName = ComponentClass.tagName || `component-${Date.now()}`;
    
    
    const staticProps = Object.getOwnPropertyNames(ComponentClass)
      .filter(prop => {
        
        if (prop === 'prototype' || prop === 'constructor' || 
            prop === 'length' || prop === 'name') {
          return false;
        }
        
        
        const descriptor = Object.getOwnPropertyDescriptor(ComponentClass, prop);
        return descriptor && descriptor.writable !== false;
      });
    
    
    class SSRComponent extends BaseComponentSSR {
      static originalName = originalName;
      static originalTagName = originalTagName;
      
      private originalName!: string;
      // @ts-ignore
      private originalTagName!: string;
      private activeTab!: string;
      
      [key: string]: any;
      static [key: string]: any;
      
      constructor() {
        super(true);
        
        try {
          
          this.originalName = originalName;
          this.originalTagName = originalTagName;
          
          
          this.activeTab = "overview";  
          
          
          if (ComponentClass.prototype) {
            
            const proto = ComponentClass.prototype;
            const methods = Object.getOwnPropertyNames(proto)
              .filter(name => {
                
                if (name === 'constructor') return false;
                
                
                return typeof proto[name] === 'function';
              });
            
            
            for (const method of methods) {
              try {
                
                if (method === 'setupTheme' || method === 'setupDirectives') {
                  console.log(`SSR: Skipping browser-specific method ${method}`);
                  continue;
                }
                
                
                this[method] = proto[method].bind(this);
              } catch (e) {
                console.warn(`Could not copy method ${method}:`, e);
              }
            }
            
            
            const props = Object.getOwnPropertyNames(proto)
              .filter(name => {
                
                if (name === 'constructor' || methods.includes(name)) return false;
                
                
                if (name.startsWith('_') || name.startsWith('#')) return false;
                
                return true;
              });
            
            
            for (const prop of props) {
              try {
                if (!this[prop] && prop in proto) {
                  
                  const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
                  if (descriptor && descriptor.value !== undefined) {
                    this[prop] = descriptor.value;
                  }
                }
              } catch (e) {
                console.warn(`Could not copy property ${prop}:`, e);
              }
            }
            
            
            if (typeof this.activeTab === 'undefined') {
              this.activeTab = "overview";
            }
          }
        } catch (error) {
          console.error('Error in SSRComponent constructor:', error);
        }
      }
      
      
      async setupTheme() {
        console.log('SSR: Theme setup skipped in SSR mode');
      }
      
      setupDirectives() {
        console.log('SSR: Directives setup skipped in SSR mode');
      }
      
      
      static toString() {
        return `SSRComponent(${this.originalName})`;
      }
      
      
      toString() {
        return `SSRComponent(${this.originalName})`;
      }
    }
    
    
    for (const prop of staticProps) {
      try {
        SSRComponent[prop] = ComponentClass[prop];
      } catch (e) {
        console.warn(`Could not copy static property ${prop}:`, e);
      }
    }
    
    
    Object.defineProperty(SSRComponent, 'tagName', {
      value: originalTagName,
      writable: true,
      configurable: true
    });
    
    
    return SSRComponent;
  } catch (error) {
    console.error('Error creating SSR component:', error);
    
    
    return class SSRFallbackComponent extends BaseComponentSSR {
      // @ts-ignore
      private activeTab!: string;
      
      [key: string]: any;
      
      constructor() {
        super(true);
        this.activeTab = "overview";
      }
      
      render() {
        return '<div class="ssr-fallback">Error creating SSR component</div>';
      }
    };
  }
} 