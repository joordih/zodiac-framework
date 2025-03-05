import { SauceContainer } from "./sauceContainer.ts";

export function Inject(token?: string): PropertyDecorator {
  return (target, propertyKey) => {
    const constructor = target.constructor as InjectionConstructor;

    if (!constructor.__injections__) {
      constructor.__injections__ = [];
    }

    constructor.__injections__.push({
      propertyKey,
      token: token || propertyKey.toString(),
    });

    const valueKey = Symbol(`__${String(propertyKey)}__value__`);

    Object.defineProperty(target, propertyKey, {
      get: function () {
        if (this[valueKey] === undefined) {
          this[valueKey] = SauceContainer.resolve(
            token || propertyKey.toString()
          );
          if (!this[valueKey]) {
            console.warn(
              `Service not found for token: ${token || propertyKey.toString()}`
            );
          }
        }
        return this[valueKey];
      },
      set: function (value) {
        this[valueKey] = value;
      },
      enumerable: true,
      configurable: true,
    });
  };
}
