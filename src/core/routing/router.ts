import { MiddlewareFunction, RouteContext } from "../middleware/middleware.ts";
import { VirtualDOM } from "../render/vdom.ts";

interface RouteDefinition {
  path: string;
  component: string;
  middlewares: MiddlewareFunction[];
}

export class Router {
  private static routes = new Map<string, RouteDefinition>();
  private static middlewares: MiddlewareFunction[] = [];
  private static currentVDom: any = null;
  private static routerViewElement: Element | null = null;
  private static initialized = false;
  private static isServer = typeof window === 'undefined';

  static register(
    path: string,
    component: string,
    middlewares: MiddlewareFunction[] = []
  ) {
    console.log(`Registering route: ${path} -> ${component}`);
    this.routes.set(path, { path, component, middlewares });

    if (this.initialized && location.pathname === path) {
      this.navigate(path, false);
    }
  }

  static use(middleware: MiddlewareFunction) {
    this.middlewares.push(middleware);
  }

  private static async runMiddlewares(
    context: RouteContext,
    middlewares: MiddlewareFunction[]
  ): Promise<void> {
    if (middlewares.length === 0) return;

    const middleware = middlewares[0];
    const remainingMiddlewares = middlewares.slice(1);

    await middleware(context, async () => {
      await this.runMiddlewares(context, remainingMiddlewares);
    });
  }

  private static async renderComponent(
    container: Element | null,
    component: string,
    context: RouteContext
  ) {
    try {
      console.log(
        `Rendering component: ${component} for path: ${context.path}`
      );
      
      if (this.isServer) {
        // Server-side rendering logic will be handled separately
        return;
      }

      const componentInstance = document.createElement(component);

      componentInstance.setAttribute("data-route-path", context.path);
      componentInstance.setAttribute("data-component", component);

      const vdom = VirtualDOM.createFromElement(componentInstance);
      const patches = VirtualDOM.diff(this.currentVDom, vdom);

      patches.forEach((patch) => patch());
      this.currentVDom = vdom;

      if (container) {
        container.innerHTML = "";
        container.appendChild(componentInstance);
      }
    } catch (error) {
      console.error(`Error rendering component ${component}:`, error);
      throw error;
    }
  }

  static async navigate(path: string, updateHistory = true) {
    console.log(`Navigating to: ${path}`);
    const route = this.routes.get(path);

    if (route) {
      const context: RouteContext = {
        path,
        params: this.extractParams(path, route.path),
        query: this.isServer ? new URLSearchParams() : new URLSearchParams(window.location.search),
        component: route.component,
      };

      try {
        if (!this.isServer) {
          if (!this.routerViewElement) {
            this.routerViewElement = document.querySelector("router-view");
            if (!this.routerViewElement) {
              this.routerViewElement = document.createElement("router-view");
              document.body.appendChild(this.routerViewElement);
              console.log("Created router-view element dynamically");
            }
          }
        }

        await this.runMiddlewares(context, this.middlewares);
        await this.runMiddlewares(context, route.middlewares);
        
        if (!this.isServer) {
          await this.renderComponent(
            this.routerViewElement,
            route.component,
            context
          );

          if (updateHistory) {
            history.pushState({}, "", path);
          }
        }
        
        return context;
      } catch (error) {
        console.error("Navigation error:", error);
        throw error;
      }
    } else {
      console.warn(`No route found for path: ${path}`);
      if (path !== "/" && this.routes.has("/")) {
        return this.navigate("/", updateHistory);
      }
      return null;
    }
  }

  private static extractParams(
    currentPath: string,
    routePath: string
  ): Record<string, string> {
    const params: Record<string, string> = {};
    const currentParts = currentPath.split("/");
    const routeParts = routePath.split("/");

    routeParts.forEach((part, index) => {
      if (part.startsWith(":")) {
        const paramName = part.slice(1);
        params[paramName] = currentParts[index] || "";
      }
    });

    return params;
  }

  static init() {
    if (this.isServer) {
      console.log("Router initialized in server mode");
      this.initialized = true;
      return;
    }

    this.routerViewElement = document.querySelector("router-view");
    if (!this.routerViewElement) {
      this.routerViewElement = document.createElement("router-view");
      document.body.appendChild(this.routerViewElement);
      console.log("Created router-view element dynamically");
    }

    window.addEventListener("popstate", () => {
      this.navigate(location.pathname, false);
    });

    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (link && link.getAttribute("href")?.startsWith("/")) {
        e.preventDefault();
        this.navigate(link.getAttribute("href") || "/");
      }
    });

    this.initialized = true;

    console.log(`Initial navigation to: ${location.pathname}`);
    this.navigate(location.pathname, false);
  }

  // Method for SSR to get route information
  static getRouteByPath(path: string): RouteDefinition | undefined {
    return this.routes.get(path);
  }

  // Method to get all registered routes
  static getAllRoutes(): Map<string, RouteDefinition> {
    return this.routes;
  }
}