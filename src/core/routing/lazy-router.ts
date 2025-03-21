import { BaseComponent } from "../component/baseComponent"
import { Router } from "./router"

export class LazyRouter extends Router {
  private loadedComponents = new Map<string, typeof BaseComponent>()

  async resolveComponent(route: string): Promise<typeof BaseComponent> {
    if (this.loadedComponents.has(route)) {
      return this.loadedComponents.get(route)!
    }

    const chunk = await this.loadChunk(route)
    this.loadedComponents.set(route, chunk.default)
    return chunk.default
  }

  private async loadChunk(route: string) {
    const config = this.getRouteConfig(route)
    return import(
      /* webpackChunkName: "[request]" */
      `@/test/components/${config.component}`
    )
  }
} 