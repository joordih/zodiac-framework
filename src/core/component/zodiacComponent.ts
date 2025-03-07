import { SauceContainer } from "@/core/injection/sauceContainer.ts";

export function ZodiacComponent(tagName: string): ClassDecorator {
  return (target: any) => {
    target.tagName = tagName;

    if (!customElements.get(tagName)) {
      customElements.define(tagName, target as any);
    }
    SauceContainer.register(tagName, target as any);
  };
}
