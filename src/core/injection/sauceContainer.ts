import { InjectionScope } from "./injection-scope.ts";
import { InjectionToken } from "./injection-token.ts";
import { Type } from "../module/module.interface.ts";

interface ProviderConfig<T> {
  useClass?: Type<T>;
  useValue?: T;
  useFactory?: (...args: any[]) => T;
  deps?: Array<string | InjectionToken<any>>;
}

export class SauceContainer {
  private static providers = new Map<string, ProviderConfig<any>>();
  private static instances = new Map<string, any>();
  private static scopes = new Map<string, InjectionScope>();

  static register<T>(
    token: string | InjectionToken<T>,
    clazz: Type<T>,
    scope: InjectionScope = InjectionScope.SINGLETON
  ) {
    const tokenKey = typeof token === "string" ? token : token.description;
    if (!this.providers.has(tokenKey)) {
      console.log(`Registering provider for token: ${tokenKey}`);
      this.providers.set(tokenKey, { useClass: clazz });
      this.scopes.set(tokenKey, scope);
    }
  }

  static registerValue<T>(token: string | InjectionToken<T>, value: T) {
    const tokenKey = typeof token === "string" ? token : token.description;
    console.log(`Registering value for token: ${tokenKey}`);
    this.instances.set(tokenKey, value);
  }

  static registerFactory<T>(
    token: string | InjectionToken<T>,
    factory: (...args: any[]) => T,
    deps?: Array<string | InjectionToken<any>>
  ) {
    const tokenKey = typeof token === "string" ? token : token.description;
    console.log(`Registering factory for token: ${tokenKey}`);
    this.providers.set(tokenKey, { useFactory: factory, deps });
    this.scopes.set(tokenKey, InjectionScope.SINGLETON);
  }

  static resolve<T>(token: string | InjectionToken<T>): T {
    const tokenKey = typeof token === "string" ? token : token.description;
    const scope = this.scopes.get(tokenKey) || InjectionScope.SINGLETON;

    if (scope === InjectionScope.SINGLETON && this.instances.has(tokenKey)) {
      return this.instances.get(tokenKey);
    }

    const provider = this.providers.get(tokenKey);
    if (!provider) {
      console.warn(`No provider found for ${tokenKey}`);
      return undefined as T;
    }

    let instance: T;

    if (provider.useClass) {
      instance = new provider.useClass();
    } else if (provider.useFactory) {
      const deps = provider.deps?.map((dep) => this.resolve(dep)) || [];
      instance = provider.useFactory(...deps);
    } else {
      throw new Error(`Invalid provider configuration for ${tokenKey}`);
    }

    if (scope === InjectionScope.SINGLETON) {
      this.instances.set(tokenKey, instance);
    }

    return instance;
  }

  static async autoRegister(): Promise<void> {
    console.log("Auto-registering providers...");

    for (const [token, _provider] of this.providers) {
      if (
        !this.instances.has(token) &&
        this.scopes.get(token) === InjectionScope.SINGLETON
      ) {
        console.log(`Auto-registering ${token}`);
        this.resolve(token);
      }
    }

    const initPromises = Array.from(this.instances).map(
      async ([token, instance]) => {
        if (
          typeof instance === "object" &&
          instance !== null &&
          "register" in instance
        ) {
          console.log(`Initializing ${token} as a service`);
          await Promise.resolve(
            (instance as { register: () => void | Promise<void> }).register()
          );
        }
      }
    );

    await Promise.all(initPromises);
  }
}
