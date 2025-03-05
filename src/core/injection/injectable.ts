import { SauceContainer } from "./sauceContainer.ts";

export function Injectable(token?: string): ClassDecorator {
  return (target) => {
    const key = token || target.name;
    console.log(`@Injectable decorator executing for: ${key}`);
    SauceContainer.register(key, target as any);

    const originalConstructor = target as any;

    return originalConstructor;
  };
}
