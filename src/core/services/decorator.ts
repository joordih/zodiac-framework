import { SauceContainer } from "@/core/injection/sauceContainer.ts";

export function ServiceData(serviceName: string): ClassDecorator {
  return (target) => {
    SauceContainer.register(serviceName, target as any);
  };
}
