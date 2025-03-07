import { BaseComponent } from "@/core/component/baseComponent.ts";
import { ZodiacComponent } from "@/core/component/zodiacComponent.ts";
import { Injectable } from "@/core/injection/injectable.ts";
import { State } from "@/core/states/state.ts";
import { Event } from "@/core/events/event.ts";
import { EventHandler } from "@/core/events/eventHandler.ts";
import { ApiService } from "../services/api-data.test.ts";
import { Inject } from "@/core/injection/inject.ts";
import {
  LoggerMiddleware,
  ErrorBoundaryMiddleware,
} from "@/core/middleware/middleware.ts";

@ZodiacComponent("api-card")
@Injectable()
export class ApiCard extends BaseComponent {
  @State()
  private count: number = 0;

  @Event("counter-changed")
  private counterChange!: (detail: { count: number }) => void;

  @Inject("api-service")
  private apiService!: ApiService;

  constructor() {
    super(true);
    console.log("ApiCard constructor called");
  }

  async connectedCallback() {
    await super.connectedCallback();
    this.render();
  }

  @EventHandler("click", "#increment")
  private handleIncrement(_e: MouseEvent) {
    this.count++;
    this.render();
  }

  @EventHandler("click", "#decrement")
  @LoggerMiddleware
  @ErrorBoundaryMiddleware
  private async handleDecrement(_e: MouseEvent) {
    if (!this.apiService) {
      console.error(
        "ApiService not available. Please ensure the service is registered."
      );
      return;
    }
    await this.apiService.fetchData();
  }

  render() {
    console.log("Rendering with count:", this.count);
    this.root.innerHTML = /* html */ `
      <style>
        :host {
          display: block;
          padding: 1rem;
        }
        button {
          padding: 0.5rem 1rem;
          cursor: pointer;
        }
      </style>
      <div>
        <h1>Button: ${this.count}</h1>
        <button id="increment" type="button">Click</button>
        <button id="decrement" type="button">Click</button>
      </div>
    `;
  }
}
