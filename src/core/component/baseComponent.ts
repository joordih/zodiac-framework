import { HTMLElement } from "../polyfills/dom.ts";
import { SauceContainer } from "@/core/injection/sauceContainer.ts";

export class BaseComponent extends HTMLElement {
  protected root: ShadowRoot | this;
  private eventHandlers: Map<string, Function[]> = new Map();
  private initialized: boolean = false;

  constructor(useShadow: boolean = false) {
    super();
    this.root = useShadow ? this.attachShadow({ mode: "open" }) : this;
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
    const eventTarget = this.root || this;
    eventTarget.addEventListener(eventName, wrappedHandler);
  }

  async connectedCallback() {
    if (!this.initialized) {
      await this.injectDependencies();
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

  private async injectDependencies() {
    const constructor = this.constructor as any;
    const injectionPromises: Promise<void>[] = [];

    if (constructor.__injections__) {
      for (const injection of constructor.__injections__) {
        const { propertyKey, token } = injection;
        injectionPromises.push(
          (async () => {
            try {
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
                console.warn(`Dependency not found for token: ${token}`);
              }
            } catch (error) {
              console.warn(
                `Error injecting dependency from decorator: ${token}`,
                error
              );
            }
          })()
        );
      }
    }

    await Promise.all(injectionPromises);
  }
}
