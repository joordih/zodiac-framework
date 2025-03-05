export function Event(eventName: string): PropertyDecorator {
  return (target, propertyKey) => {
    Object.defineProperty(target, propertyKey, {
      get() {
        return (detail?: any) => {
          this.dispatchEvent(
            new CustomEvent(eventName, {
              detail,
              bubbles: true,
              composed: true,
            })
          );
        };
      },
    });
  };
}

export interface EventDefinition<T = any> {
  name: string;
  createEvent: (detail: T) => CustomEvent<T>;
}

export function defineEvent<T = any>(name: string): EventDefinition<T> {
  return {
    name,
    createEvent: (detail: T) =>
      new CustomEvent<T>(name, {
        detail,
        bubbles: true,
        composed: true,
      }),
  };
}
