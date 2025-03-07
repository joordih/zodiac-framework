import { Inject } from "../../injection/inject.ts";
import { TypedRouterService } from "./router-service.ts";
import { RouteParams, RouteQueryParams, TypedRoute } from "./route-definition.ts";
import { BaseComponent } from "@/core/component/baseComponent.ts";
import { ZodiacComponent } from "@/core/component/zodiacComponent.ts";

@ZodiacComponent('router-link')
export class RouterLink extends BaseComponent {
  @Inject('typed-router-service')
  private routerService!: TypedRouterService;
  
  private route?: TypedRoute<any, any>;
  private params: RouteParams = {};
  private queryParams: RouteQueryParams = {};
  private replaceState = false;
  
  async connectedCallback() {
    await super.connectedCallback();
    
    if (!this.querySelector('a')) {
      const anchor = document.createElement('a');
      
      while (this.firstChild) {
        anchor.appendChild(this.firstChild);
      }
      
      anchor.addEventListener('click', this.handleClick.bind(this));
      
      anchor.setAttribute('href', 'javascript:void(0)');
      
      this.appendChild(anchor);
    }
  }
  
  setRoute(route: TypedRoute<any, any>): void {
    this.route = route;
    this.updateHref();
  }
  
  setParams(params: RouteParams): void {
    this.params = params;
    this.updateHref();
  }
  
  setQueryParams(queryParams: RouteQueryParams): void {
    this.queryParams = queryParams;
    this.updateHref();
  }
  
  setReplaceState(replaceState: boolean): void {
    this.replaceState = replaceState;
  }
  
  private updateHref(): void {
    if (!this.route) {
      return;
    }
    
    const anchor = this.querySelector('a');
    
    if (anchor) {
      const path = this.routerService.buildPath(this.route.path, this.params);
      anchor.setAttribute('href', path);
    }
  }
  
  private handleClick(event: MouseEvent): void {
    event.preventDefault();
    
    if (!this.route) {
      return;
    }
    
    this.routerService.navigate(
      this.route,
      this.params,
      this.queryParams,
      { replaceState: this.replaceState }
    );
  }
}
