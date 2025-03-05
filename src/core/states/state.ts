export function State(): PropertyDecorator {
  return (target, propertyKey) => {
    let value: any;
    Object.defineProperty(target, propertyKey, {
      get() {
        return value;
      },
      set(newValue) {
        const oldValue = value;
        value = newValue;

        if (this.__stateObservers__ && this.__stateObservers__[propertyKey]) {
          this.__stateObservers__[propertyKey].forEach((callback: Function) => {
            callback(newValue, oldValue, propertyKey);
          });
        }

        if (typeof this.render === "function") {
          this.render();
        }
      },
    });
  };
}

export class StateObject {
  private __stateObservers__: Record<string | symbol, Function[]> = {};

  observeState(
    property: string,
    callback: (newValue: any, oldValue: any, property: string | symbol) => void
  ): () => void {
    if (!this.__stateObservers__[property]) {
      this.__stateObservers__[property] = [];
    }

    this.__stateObservers__[property].push(callback);

    return () => {
      this.__stateObservers__[property] = this.__stateObservers__[
        property
      ].filter((cb) => cb !== callback);
    };
  }
}
