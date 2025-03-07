import { InjectionProperty } from "../index.js";
import { SauceContainer } from "./sauceContainer.ts";
import { InjectionToken } from "./injection-token.ts";

/**
 * Decorator for injecting dependencies into class properties
 * @param token The token to use for dependency resolution
 */
export function Inject(token?: string | InjectionToken<any>): PropertyDecorator {
  return (target, propertyKey) => {
    const constructor = target.constructor as InjectionProperty;

    if (!constructor.__injections__) {
      constructor.__injections__ = [];
    }

    const tokenValue = token || propertyKey.toString();
    const tokenKey = typeof tokenValue === 'string' ? tokenValue : tokenValue.description;

    constructor.__injections__.push({
      propertyKey,
      token: tokenKey,
    });

    const valueKey = Symbol(`__${String(propertyKey)}__value__`);

    Object.defineProperty(target, propertyKey, {
      get: function () {
        if (this[valueKey] === undefined) {
          this[valueKey] = SauceContainer.resolve(tokenValue);
          if (!this[valueKey]) {
            console.warn(
              `Service not found for token: ${tokenKey}`
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
