import { SauceContainer } from "@/core/injection/sauceContainer.ts";

export function ZodiacComponent(tagName: string): ClassDecorator {
  return (target) => {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, target as any);
    }
    SauceContainer.register(tagName, target as any);
  };
}
