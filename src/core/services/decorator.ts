import { InjectionScope } from "@/core/injection/injection-scope.ts";
import { InjectionToken } from "@/core/injection/injection-token.ts";
import { SauceContainer } from "@/core/injection/sauceContainer.ts";

export interface ServiceDataOptions {
  token: string | InjectionToken<any>;
  scope?: InjectionScope;
}

export function ServiceData(options: ServiceDataOptions): ClassDecorator {
  const { token, scope = InjectionScope.SINGLETON } = options;
  
  return (target) => {
    SauceContainer.register(token, target as any, scope);
    Reflect.defineMetadata("zodiac:service", { token }, target);
  };
}
