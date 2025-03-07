import { Router } from "./router.ts";

export function Route(path: string): ClassDecorator {
  return (target: any) => {
    // Use setTimeout to ensure this runs after all decorators have been applied
    setTimeout(() => {
      const tagName = target.tagName;
      if (tagName) {
        Router.register(path, tagName);
      } else {
        console.warn(
          `@Route decorator should be used after @ZodiacComponent on ${target.name}`
        );
      }
    }, 0);
    
    return target;
  };
}
