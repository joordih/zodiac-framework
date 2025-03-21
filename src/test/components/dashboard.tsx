import { BaseComponent } from "@/core/component/baseComponent.ts";
import { useEffect, useService } from "@/core/component/hooks/index.ts";
import { ZodiacComponent } from "@/core/component/zodiacComponent.ts";
import { DirectiveManager } from "@/core/directives/directive-manager.ts";
import { EventHandler } from "@/core/events/eventHandler.ts";
import { TypedEventComponent } from "@/core/events/typed/typed-event-component.ts";
import { TypedEvents } from "@/core/events/typed/typed-event-decorator.ts";
import { Inject } from "@/core/injection/inject.ts";
import { Injectable } from "@/core/injection/injectable.ts";
import { Render } from "@/core/render/vdom.ts";
import { TypedRouterService } from "@/core/router/typed/router-service.ts";
import { Route } from "@/core/routing/route.ts";
import { State } from "@/core/states/state.ts";
import { ThemeService } from "../services/theme-service.ts";


interface GlobalWithDOM {
  Element?: any;
  HTMLElement?: any;
  Document?: any;
  document?: any;
  [key: string]: any;
}

const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const globalObj = (typeof global !== 'undefined' ? global : 
                 typeof window !== 'undefined' ? window : 
                 typeof globalThis !== 'undefined' ? globalThis : {}) as GlobalWithDOM;


if (!isBrowser) {
  
  class Element {
    
  }
  
  class HTMLElement extends Element {
    
    public tagName: string = '';
  }
  
  class Document extends Element {
    createElement(tagName: string): HTMLElement {
      const element = new HTMLElement();
      element.tagName = tagName.toUpperCase();
      return element;
    }
    
  }
  
  
  globalObj.Element = Element;
  globalObj.HTMLElement = HTMLElement;
  globalObj.Document = Document;
  globalObj.document = new Document();
} 


export const Element = globalObj.Element;
export const HTMLElement = globalObj.HTMLElement;
export const Document = globalObj.Document;

export interface DashboardEvents {
  "date-range-change": {
    startDate: string;
    endDate: string;
  };
  "metric-click": {
    metricName: string;
  };
}

interface Tab {
  name: string;
  label: string;
}

const TABS: Tab[] = [
  { name: "overview", label: "Overview" },
  { name: "analytics", label: "Analytics" },
  { name: "reports", label: "Reports" },
  { name: "notifications", label: "Notifications" }
];

@ZodiacComponent("dashboard-component")
@Injectable()
@Route("/dashboard")
@TypedEvents<DashboardEvents>()
export class DashboardComponent extends BaseComponent implements TypedEventComponent<DashboardEvents> {
  @State()
  private dateRange = {
    startDate: "Jan 20, 2023",
    endDate: "Feb 09, 2023"
  };

  @State()
  private activeTab: string = "overview";

  @Inject("theme-service")
  private themeService!: ThemeService;

  @Inject("typed-router-service")
  // @ts-ignore
  private routerService!: TypedRouterService;

  @Inject("directive-manager")
  private directiveManager!: DirectiveManager;

  emit!: <K extends keyof DashboardEvents>(event: K, data: DashboardEvents[K]) => void;
  on!: <K extends keyof DashboardEvents>(event: K, listener: (data: DashboardEvents[K]) => void) => { unsubscribe: () => void };
  once!: <K extends keyof DashboardEvents>(event: K, listener: (data: DashboardEvents[K]) => void) => { unsubscribe: () => void };
  off!: <K extends keyof DashboardEvents>(event: K, listener: (data: DashboardEvents[K]) => void) => void;

  constructor() {
    super(true);
  }

  async connectedCallback() {
    await super.connectedCallback();
    await this.initializeComponent();
  }

  private async initializeComponent() {
    try {
      await this.initializeServices();
      if (isBrowser) {
        await this.setupTheme();
      }
      this.render();
      if (isBrowser) {
        this.setupDirectives();
      }
    } catch (error) {
      console.error("Error initializing dashboard:", error);
    }
  }

  private async initializeServices() {
    try {
      this.routerService = useService(this, "typed-router-service");
      this.directiveManager = useService(this, "directive-manager");
    } catch (error) {
      console.warn("Service initialization failed:", error);
    }
  }

  private async setupTheme() {
    if (!this.themeService) {
      console.warn("Theme service not available");
      return;
    }

    useEffect(this, () => {
      const updateTheme = (effectiveTheme: string) => {
        if (isBrowser) {
          document.documentElement.classList.toggle("dark", effectiveTheme === "dark");
        }
      };

      const effectiveTheme = this.themeService.getEffectiveTheme();
      updateTheme(effectiveTheme);

      const unsubscribe = this.themeService.subscribe((_, theme) => updateTheme(theme));

      return () => unsubscribe();
    }, {});
  }

  private setupDirectives() {
    if (!this.directiveManager) {
      console.warn("DirectiveManager not available");
      return;
    }

    
    if (typeof this.directiveManager.applyDirectives !== 'function') {
      console.warn("DirectiveManager.applyDirectives is not a function");
      return;
    }

    const lazyLoadElements = this.root.querySelectorAll("[lazy-load]");
    if (lazyLoadElements.length > 0) {
      this.directiveManager.applyDirectives(lazyLoadElements);
    }
  }

  @EventHandler("click", ".date-range-selector")
  // @ts-ignore
  private handleDateRangeClick() {
    console.log("Date range selector clicked");
  }

  @EventHandler("click", ".tab")
  // @ts-ignore
  private handleTabClick(_e: MouseEvent, element: Element) {
    const tabName = element.textContent?.toLowerCase() || "overview";
    this.activeTab = tabName;
    this.render();
  }

  private getTabContent(tabName: string): string {
    
    const safeTabName = typeof tabName === 'string' ? tabName : "overview";
    const componentName = safeTabName.toLowerCase();
    
    if (isBrowser) {
      return `<div lazy-load src-lazy="@/test/components/dashboard/${componentName}.tsx">
        <${componentName}-component data-component="${componentName}-component"></${componentName}-component>
      </div>`;
    } else {
      return `<div class="tab-placeholder">
        <p>Loading ${componentName} content...</p>
      </div>`;
    }
  }

  @Render()
  render() {
    
    const safeActiveTab = typeof this.activeTab === 'string' ? this.activeTab : "overview";
    const safeDateRange = this.dateRange || {
      startDate: "Jan 20, 2023",
      endDate: "Feb 09, 2023"
    };
    
    
    const template = `
      <div class="dashboard-root">
        <style>
          :host {
            display: block;
            font-family: system-ui, -apple-system, sans-serif;
            color: var(--text-color);
            background-color: var(--bg-color);
            --chart-bars: hsl(240, 10%, 3.9%);
            --chart-bars-accent: hsl(240, 8.30%, 14.10%);
            --text-color: hsl(240, 10%, 3.9%);
          }

          :host-context(html.dark) {
            --text-color: hsl(0, 0%, 98%);
            --bg-color: hsl(240, 10%, 3.9%);
            --card-bg: hsl(240, 10%, 3.9%);
            --border-color: hsl(240, 10%, 10%);
            --muted-color: hsl(240, 5%, 64.9%);
            --primary-color: hsl(142.1, 76.2%, 36.3%);
            --chart-bars: hsl(0, 0%, 98%);
          }

          .dashboard {
            padding: 1rem;
            max-width: 1200px;
            margin: 0 auto;
          }

          .dashboard-header {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            gap: 1rem;
          }

          @media (max-width: 640px) {
            .dashboard {
              padding: 0.75rem;
            }

            .dashboard-header {
              flex-direction: column;
              align-items: flex-start;
              gap: 0.75rem;
            }

            .dashboard-title {
              font-size: 1.25rem;
            }

            .date-range {
              width: 100%;
              justify-content: space-between;
            }
          }

          .dashboard-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin: 0;
          }

          .date-range {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .date-range-selector {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.75rem;
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 0.875rem;
          }

          .download-btn {
            padding: 0.5rem 0.75rem;
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 0.875rem;
            color: var(--text-color);
          }

          .tabs {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }

          .tab {
            padding: 0.5rem 0;
            cursor: pointer;
            font-size: 0.875rem;
            color: var(--muted-color);
            border-bottom: 2px solid transparent;
          }

          .tab.active {
            color: var(--text-color);
            border-bottom: 2px solid var(--text-color);
          }

          .tab-placeholder {
            padding: 2rem;
            text-align: center;
            color: var(--muted-color);
          }
        </style>

        <div class="dashboard">
          <div class="dashboard-header">
            <h1 class="dashboard-title">Dashboard</h1>
            <div class="date-range">
              <div class="date-range-selector">
                <span>${safeDateRange ? `${safeDateRange.startDate} - ${safeDateRange.endDate}` : 'No date range'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
              <button class="download-btn">Download</button>
            </div>
          </div>

          <div class="tabs">
            ${TABS.map(tab => `
              <div class="tab ${safeActiveTab === tab.name ? 'active' : ''}">${tab.label}</div>
            `).join('')}
          </div>

          <div class="tab-content">
            ${this.getTabContent(safeActiveTab)}
          </div>
        </div>
      </div>
    `;
    
    
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = template;
    }
    
    
    return template;
  }
} 