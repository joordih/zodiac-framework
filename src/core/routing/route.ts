import { Router } from "./router.ts";

export function Route(path: string): ClassDecorator {
  return (target) => {
    Router.register(path, (target as any).tagName.toLowerCase());
  };
}
