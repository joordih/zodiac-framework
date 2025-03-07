import { BaseComponent } from "@/core/component/baseComponent.ts";
import { ZodiacComponent } from "@/core/component/zodiacComponent.ts";

@ZodiacComponent('router-outlet')
export class RouterOutlet extends BaseComponent {
  async connectedCallback() {
    await super.connectedCallback();
  }
}
