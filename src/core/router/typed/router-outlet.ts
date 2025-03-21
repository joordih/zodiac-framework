import { BaseComponent } from "@/core/component/baseComponent.ts";
import { ZodiacComponent } from "@/core/component/zodiacComponent.ts";
import { Inject } from "@/core/injection/inject.ts";
import { TypedRouterService } from "./router-service.ts";
import { IRouterOutlet } from "./router-outlet-interface.ts";

@ZodiacComponent('router-outlet')
export class RouterOutlet extends BaseComponent implements IRouterOutlet {
  @Inject('typed-router-service')
  private routerService!: TypedRouterService;
  
  async connectedCallback() {
    await super.connectedCallback();
    
    
    if (!this.root) {
      this.root = this.shadowRoot || this.attachShadow({ mode: 'open' });
    }
    
    
    if (this.routerService) {
      this.routerService.registerOutlet(this);
    } else {
      console.warn('Router service not available in router-outlet');
    }
  }
  
  
  renderComponent(component: HTMLElement) {
    if (!this.root) {
      this.root = this.shadowRoot || this.attachShadow({ mode: 'open' });
    }
    
    
    while (this.root.firstChild) {
      this.root.removeChild(this.root.firstChild);
    }
    
    
    this.root.appendChild(component);
  }
}
