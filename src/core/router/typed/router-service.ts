import { TypedRoute, RouteParams, RouteQueryParams } from "./route-definition.ts";
import { IService } from "../../services/service.ts";
import { ServiceData } from "../../services/decorator.ts";
import { InjectionScope } from "../../injection/injection-scope.ts";
import { IRouterOutlet } from "./router-outlet-interface.ts";

const isBrowser = typeof window !== 'undefined';

@ServiceData({
  token: 'typed-router-service',
  scope: InjectionScope.SINGLETON
})
export class TypedRouterService implements IService {
  private routes: Array<TypedRoute<any, any>> = [];
  private currentPath: string = '';
  private listeners: Array<(path: string) => void> = [];
  private outlets: IRouterOutlet[] = [];
  
  async onInit(): Promise<void> {
    if (isBrowser) {
      window.addEventListener('popstate', () => {
        this.handleLocationChange();
      });
    }
    
    this.handleLocationChange();
  }
  
  async onDestroy(): Promise<void> {
    if (isBrowser) {
      window.removeEventListener('popstate', () => {
        this.handleLocationChange();
      });
    }
  }
  
  register(): void | Promise<void> {
    return;
  }
  
  unregister(): void | Promise<void> {
    return;
  }
  
  registerRoutes(routes: Array<TypedRoute<any, any>>): void {
    this.routes = routes;
    this.handleLocationChange();
  }
  
  registerOutlet(outlet: IRouterOutlet): void {
    if (!this.outlets.includes(outlet)) {
      this.outlets.push(outlet);
      
      
      const routeMatch = this.getCurrentRouteMatch();
      if (routeMatch.route) {
        this.activateRoute(routeMatch.route, routeMatch.params, routeMatch.queryParams);
      }
    }
  }
  
  navigate<
    Params extends RouteParams,
    QueryParams extends RouteQueryParams
  >(
    route: TypedRoute<Params, QueryParams>,
    params: Params = {} as Params,
    queryParams: QueryParams = {} as QueryParams,
    options: { replaceState?: boolean } = {}
  ): void {
    if (!isBrowser) return;
    
    const path = this.buildPath(route.path, params);
    const queryString = this.buildQueryString(queryParams);
    const fullPath = queryString ? `${path}?${queryString}` : path;
    
    if (options.replaceState) {
      window.history.replaceState({}, '', fullPath);
    } else {
      window.history.pushState({}, '', fullPath);
    }
    
    this.handleLocationChange();
  }
  
  subscribe(listener: (path: string) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  getCurrentPath(): string {
    if (isBrowser) {
      return window.location.pathname;
    }
    return this.currentPath;
  }
  
  getCurrentRouteMatch(): { 
    route: TypedRoute<any, any> | null; 
    params: RouteParams; 
    queryParams: RouteQueryParams 
  } {
    const path = this.getCurrentPath();
    return this.matchRoute(path);
  }
  
  buildPath<Params extends RouteParams>(
    pathPattern: string,
    params: Params
  ): string {
    let path = pathPattern;
    
    for (const key in params) {
      path = path.replace(`:${key}`, String(params[key]));
    }
    
    return path;
  }
  
  private buildQueryString<QueryParams extends RouteQueryParams>(
    queryParams: QueryParams
  ): string {
    const parts: string[] = [];
    
    for (const key in queryParams) {
      const value = queryParams[key];
      
      if (value === undefined) {
        continue;
      }
      
      if (Array.isArray(value)) {
        for (const item of value) {
          parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`);
        }
      } else {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    }
    
    return parts.join('&');
  }
  
  private parseQueryParams(queryString: string): RouteQueryParams {
    if (!queryString) {
      return {};
    }
    
    const params: RouteQueryParams = {};
    const searchParams = new URLSearchParams(queryString);
    
    for (const [key, value] of searchParams.entries()) {
      if (key.endsWith('[]')) {
        const arrayKey = key.slice(0, -2);
        if (!params[arrayKey]) {
          params[arrayKey] = [];
        }
        
        if (Array.isArray(params[arrayKey])) {
          (params[arrayKey] as any[]).push(value);
        }
      } else {
        params[key] = value;
      }
    }
    
    return params;
  }
  
  private handleLocationChange(): void {
    if (!isBrowser) return;
    
    const path = window.location.pathname;
    const queryString = window.location.search.substring(1);
    
    this.currentPath = path;
    
    for (const listener of this.listeners) {
      listener(path);
    }
    
    const { route, params, queryParams } = this.matchRoute(path, queryString);
    
    if (route) {
      if (route.canActivate) {
        const canActivate = route.canActivate(params, queryParams);
        
        if (canActivate instanceof Promise) {
          canActivate.then(result => {
            this.handleActivationResult(result, route, params, queryParams);
          });
        } else {
          this.handleActivationResult(canActivate, route, params, queryParams);
        }
      } else {
        this.activateRoute(route, params, queryParams);
      }
    }
  }
  
  private handleActivationResult(
    result: boolean | string,
    route: TypedRoute<any, any>,
    params: RouteParams,
    queryParams: RouteQueryParams
  ): void {
    if (!isBrowser) return;
    
    if (result === true) {
      this.activateRoute(route, params, queryParams);
    } else if (typeof result === 'string') {
      window.history.replaceState({}, '', result);
      this.handleLocationChange();
    }
  }
  
  private activateRoute(
    route: TypedRoute<any, any>,
    params: RouteParams,
    queryParams: RouteQueryParams
  ): void {
    if (!isBrowser) return;
    
    if (route.title) {
      document.title = route.title;
    }
    
    
    if (this.outlets.length > 0) {
      const component = document.createElement(route.component);
      
      for (const key in params) {
        component.setAttribute(`data-param-${key}`, String(params[key]));
      }
      
      for (const key in queryParams) {
        const value = queryParams[key];
        
        if (Array.isArray(value)) {
          component.setAttribute(`data-query-${key}`, JSON.stringify(value));
        } else if (value !== undefined) {
          component.setAttribute(`data-query-${key}`, String(value));
        }
      }
      
      
      for (const outlet of this.outlets) {
        outlet.renderComponent(component.cloneNode(true) as HTMLElement);
      }
    } else {
      
      const outlet = document.querySelector('router-outlet');
      
      if (outlet) {
        const component = document.createElement(route.component);
        
        for (const key in params) {
          component.setAttribute(`data-param-${key}`, String(params[key]));
        }
        
        for (const key in queryParams) {
          const value = queryParams[key];
          
          if (Array.isArray(value)) {
            component.setAttribute(`data-query-${key}`, JSON.stringify(value));
          } else if (value !== undefined) {
            component.setAttribute(`data-query-${key}`, String(value));
          }
        }
        
        outlet.innerHTML = '';
        outlet.appendChild(component);
      }
    }
  }
  
  private matchRoute(
    path: string,
    queryString: string = isBrowser ? window.location.search.substring(1) : ''
  ): { 
    route: TypedRoute<any, any> | null; 
    params: RouteParams; 
    queryParams: RouteQueryParams 
  } {
    const queryParams = this.parseQueryParams(queryString);
    
    for (const route of this.routes) {
      const params = this.matchRoutePath(route.path, path);
      
      if (params !== null) {
        return { route, params, queryParams };
      }
    }
    
    return { route: null, params: {}, queryParams };
  }
  
  private matchRoutePath(pattern: string, path: string): RouteParams | null {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);
    
    if (patternParts.length !== pathParts.length) {
      return null;
    }
    
    const params: RouteParams = {};
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];
      
      if (patternPart.startsWith(':')) {
        const paramName = patternPart.slice(1);
        params[paramName] = pathPart;
      } else if (patternPart !== pathPart) {
        return null;
      }
    }
    
    return params;
  }
}
