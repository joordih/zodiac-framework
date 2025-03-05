import { Injectable } from '../../core/injection/injectable.ts';
import { Inject } from '../../core/injection/inject.ts';
import { Render } from '../../core/render/vdom.ts';
import { LoggerMiddleware, ErrorBoundaryMiddleware } from '../../core/middleware/middleware.ts';
import { ApiService } from '../services/api-data.test.ts';
import { ZodiacComponent } from '../../core/component/zodiacComponent.ts';
import { Event } from '../../core/events/event.ts';
import { EventHandler } from '../../core/events/eventHandler.ts';
import { State } from '@/core/states/state.ts';
import { BaseComponent } from '@/core/component/baseComponent.ts';

@ZodiacComponent("api-card")
@Injectable()
export class ModernApiCard extends BaseComponent {
  @State()
  private count: number = 0;

  @Event('counter-changed')
  private counterChange!: (detail: { count: number }) => void;

  @Inject()
  private apiService!: ApiService;

  constructor() {
    super(true);
    this.root = this.attachShadow({ mode: 'open' });
    console.log("ModernApiCard constructor called");
  }

  connectedCallback() {
    this.render();
  }

  @EventHandler('click', '#increment')
  private handleIncrement(_e: MouseEvent) {
    this.count++;
    this.render();
    this.counterChange({ count: this.count });
  }

  @EventHandler('click', '#decrement')
  private async handleDecrement(_e: MouseEvent) {
    await this.apiService.fetchData();
  }

  render() {
    console.log("Rendering with count:", this.count);
    return this.root.innerHTML = /* html */ `
      <div class="api-card">
        <style>
          .api-card {
            display: block;
            padding: 1rem;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            font-family: system-ui, -apple-system, sans-serif;
          }
          h1 {
            color: #2c3e50;
            font-size: 1.5rem;
            margin-bottom: 1rem;
          }
          .button-group {
            display: flex;
            gap: 0.5rem;
          }
          button {
            padding: 0.5rem 1rem;
            cursor: pointer;
            border: none;
            border-radius: 4px;
            font-weight: 500;
            transition: all 0.2s ease;
          }
          #increment {
            background: #3498db;
            color: white;
          }
          #increment:hover {
            background: #2980b9;
          }
          #decrement {
            background: #e74c3c;
            color: white;
          }
          #decrement:hover {
            background: #c0392b;
          }
        </style>
        <h1>Counter Value: ${this.count}</h1>
        <div class="button-group">
          <button id="increment" type="button">Increment</button>
          <button id="decrement" type="button">Fetch Data</button>
        </div>
      </div>
    `;
  }
}
