import { SauceContainer } from "@core/injection/sauceContainer.ts";

export class BaseComponent extends HTMLElement {
  protected root: ShadowRoot | this;
  private eventHandlers: Map<string, Function[]> = new Map();
  private initialized: boolean = false;

  constructor(useShadow: boolean = false) {
    super();
    this.root = useShadow ? this.attachShadow({ mode: "open" }) : this;
    this.injectDependencies();
    this.initialized = true;
  }

  protected delegateEvent(
    eventName: string,
    selector: string,
    handler: (event: Event, element: Element) => void
  ): void {
    const wrappedHandler = (event: Event) => {
      const target = event.target as Element;
      if (target && target.matches(selector)) {
        handler.call(this, event, target);
      } else {
        const closest = target?.closest(selector);
        if (closest) {
          handler.call(this, event, closest);
        }
      }
    };

    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }

    this.eventHandlers.get(eventName)?.push(wrappedHandler);
    // Usar root para eventos cuando se usa Shadow DOM
    const eventTarget = this.root || this;
    eventTarget.addEventListener(eventName, wrappedHandler);
  }

  connectedCallback() {
    // Solo inyectar dependencias si no se ha hecho ya
    if (!this.initialized) {
      this.injectDependencies();
      this.initialized = true;
    }
  }

  disconnectedCallback() {
    const eventTarget = this.root || this;
    this.eventHandlers.forEach((handlers, eventName) => {
      handlers.forEach((handler) => {
        eventTarget.removeEventListener(eventName, handler as EventListener);
      });
    });
    this.eventHandlers.clear();
  }

  private injectDependencies() {
    const constructor = this.constructor as any;

    if (constructor.__injections__) {
      for (const injection of constructor.__injections__) {
        const { propertyKey, token } = injection;
        try {
          const descriptor = Object.getOwnPropertyDescriptor(this, propertyKey);

          if (descriptor?.get && !descriptor.set) {
            void (this as any)[propertyKey];
            continue;
          }

          const dependency = SauceContainer.resolve(token);
          if (dependency) {
            (this as any)[propertyKey] = dependency;
          } else {
            console.warn(`Dependency not found for token: ${token}`);
          }
        } catch (error) {
          console.warn(
            `Error injecting dependency from decorator: ${token}`,
            error
          );
        }
      }
    }

    const props = Object.getOwnPropertyNames(this);
    for (const prop of props) {
      const descriptor = Object.getOwnPropertyDescriptor(this, prop);

      if (!descriptor?.get && (this as any)[prop] === undefined) {
        try {
          const dependency = SauceContainer.resolve(prop);
          if (dependency) {
            (this as any)[prop] = dependency;
          }
        } catch (error) {
          // Solo mostrar warning si la propiedad parece ser una dependencia
          if (prop.endsWith('Service') || prop.endsWith('Provider') || prop.endsWith('Manager')) {
            console.warn(`Error injecting dependency: ${prop}`, error);
          }
        }
      }
    }
  }
}
