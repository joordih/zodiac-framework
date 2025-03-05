// eslint-disable no-invalid-remove-event-listener
export function EventHandler(
  eventName: string,
  selector?: string,
  options?: AddEventListenerOptions
): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const originalConnectedCallback = target.connectedCallback;
    const originalDisconnectedCallback = target.disconnectedCallback;

    target.connectedCallback = function (this: HTMLElement & { root?: ShadowRoot | HTMLElement }) {
      if (originalConnectedCallback) {
        originalConnectedCallback.call(this);
      }

      const handler = (event: Event) => {
        console.log("Event handler called", event);
        if (!selector) {
          (this as any)[propertyKey].call(this, event);
        } else {
          const target = event.target as Element;
          const matchingElement = target.matches(selector) ? target : target.closest(selector);
          if (matchingElement) {
            (this as any)[propertyKey].call(this, event, matchingElement);
          }
        }
      };

      (this as any)[`__${String(propertyKey)}_handler`] = handler;

      const eventTarget = this.root || this;
      console.log("Adding event listener to", eventTarget, "for event", eventName, "with selector", selector);
      eventTarget.addEventListener(eventName, handler, options);
    };

    target.disconnectedCallback = function (this: HTMLElement & { root?: ShadowRoot | HTMLElement }) {
      const handler = (this as any)[`__${String(propertyKey)}_handler`];
      const eventTarget = this.root || this;

      if (handler) {
        eventTarget.removeEventListener(eventName, handler, options);
      }

      if (originalDisconnectedCallback) {
        originalDisconnectedCallback.call(this);
      }
    };

    return descriptor;
  };
}

export class EventHandlerManager {
  private handlers: Map<string, Function[]> = new Map();
  private element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  on<K extends keyof HTMLElementEventMap>(
    eventName: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions
  ): void {
    if (!this.handlers.has(eventName as string)) {
      this.handlers.set(eventName as string, []);
    }

    this.handlers.get(eventName as string)!.push(handler as Function);
    this.element.addEventListener(eventName, handler as EventListener, options);
  }

  off<K extends keyof HTMLElementEventMap>(
    eventName: K,
    handler: (event: HTMLElementEventMap[K]) => void
  ): void {
    const handlers = this.handlers.get(eventName as string);
    if (handlers) {
      const index = handlers.indexOf(handler as Function);
      if (index !== -1) {
        handlers.splice(index, 1);
        this.element.removeEventListener(eventName, handler as EventListener);
      }
    }
  }

  removeAll(): void {
    this.handlers.forEach((handlers, eventName) => {
      handlers.forEach((handler) => {
        this.element.removeEventListener(
          eventName as keyof HTMLElementEventMap,
          handler as EventListener
        );
      });
    });
    this.handlers.clear();
  }
}
