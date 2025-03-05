import { MiddlewareFunction, RouteContext } from '../middleware/middleware.ts';
import { VirtualDOM } from '../render/vdom.ts';

interface RouteDefinition {
  path: string;
  component: string;
  middlewares: MiddlewareFunction[];
}

export class Router {
  private static routes = new Map<string, RouteDefinition>();
  private static middlewares: MiddlewareFunction[] = [];
  private static currentVDom: any = null;

  static register(path: string, component: string, middlewares: MiddlewareFunction[] = []) {
    this.routes.set(path, { path, component, middlewares });
  }

  static use(middleware: MiddlewareFunction) {
    this.middlewares.push(middleware);
  }

  private static async runMiddlewares(context: RouteContext, middlewares: MiddlewareFunction[]): Promise<void> {
    if (middlewares.length === 0) return;

    const middleware = middlewares[0];
    const remainingMiddlewares = middlewares.slice(1);

    await middleware(context, async () => {
      await this.runMiddlewares(context, remainingMiddlewares);
    });
  }

  private static async renderComponent(container: Element, component: string, context: RouteContext) {
    try {
      const componentInstance = document.createElement(component);
      
      componentInstance.setAttribute('data-route-path', context.path);
      componentInstance.setAttribute('data-component', component);
      
      const vdom = VirtualDOM.createFromElement(componentInstance);
      const patches = VirtualDOM.diff(this.currentVDom, vdom);
      
      patches.forEach(patch => patch());
      this.currentVDom = vdom;
      
      container.innerHTML = '';
      container.appendChild(componentInstance);
    } catch (error) {
      console.error(`Error rendering component ${component}:`, error);
      throw error;
    }
  }

  static async navigate(path: string) {
    const route = this.routes.get(path);
    if (route) {
      const context: RouteContext = {
        path,
        params: this.extractParams(path, route.path),
        query: new URLSearchParams(window.location.search),
        component: route.component
      };

      try {
        await this.runMiddlewares(context, this.middlewares);
        await this.runMiddlewares(context, route.middlewares);

        const container = document.querySelector("router-view");
        if (container) {
          await this.renderComponent(container, route.component, context);
        }
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }
    history.pushState({}, "", path);
  }

  private static extractParams(currentPath: string, routePath: string): Record<string, string> {
    const params: Record<string, string> = {};
    const currentParts = currentPath.split('/');
    const routeParts = routePath.split('/');

    routeParts.forEach((part, index) => {
      if (part.startsWith(':')) {
        const paramName = part.slice(1);
        params[paramName] = currentParts[index] || '';
      }
    });

    return params;
  }

  static init() {
    if (!document.querySelector('router-view')) {
      const routerView = document.createElement('router-view');
      document.body.appendChild(routerView);
    }

    window.addEventListener('popstate', () => {
      this.navigate(location.pathname);
    });

    this.navigate(location.pathname);
  }
}