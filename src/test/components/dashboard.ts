import { BaseComponent } from "@/core/component/baseComponent.ts";
import { useEffect, useService } from "@/core/component/hooks/index.ts";
import { ZodiacComponent } from "@/core/component/zodiacComponent.ts";
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
import { DirectiveManager } from "@/core/directives/directive-manager.ts";

export interface DashboardEvents {
  "date-range-change": {
    startDate: string;
    endDate: string;
  };
  "metric-click": {
    metricName: string;
  };
}

@ZodiacComponent("dashboard-component")
@Injectable()
@Route("/dashboard")
@TypedEvents<DashboardEvents>()
export class DashboardComponent
  extends BaseComponent
  implements TypedEventComponent<DashboardEvents>
{
  @State()
  private dateRange: {
    startDate: string;
    endDate: string;
  } = {
    startDate: "Jan 20, 2023",
    endDate: "Feb 09, 2023",
  };

  @Inject("theme-service")
  private themeService!: ThemeService;

  @Inject("typed-router-service")
  private routerService!: TypedRouterService;

  @Inject("directive-manager")
  private directiveManager!: DirectiveManager;

  emit!: <K extends keyof DashboardEvents>(
    event: K,
    data: DashboardEvents[K]
  ) => void;
  on!: <K extends keyof DashboardEvents>(
    event: K,
    listener: (data: DashboardEvents[K]) => void
  ) => {
    unsubscribe: () => void;
  };
  once!: <K extends keyof DashboardEvents>(
    event: K,
    listener: (data: DashboardEvents[K]) => void
  ) => {
    unsubscribe: () => void;
  };
  off!: <K extends keyof DashboardEvents>(
    event: K,
    listener: (data: DashboardEvents[K]) => void
  ) => void;

  constructor() {
    super(true);
  }

  async connectedCallback() {
    await super.connectedCallback();

    try {
      try {
        this.routerService = useService(this, "typed-router-service");
        this.directiveManager = useService(this, "directive-manager");
      } catch (error) {
        console.warn("Service not available:", error);
      }

      useEffect(
        this,
        () => {
          console.log("Dashboard component mounted");
          if (this.themeService) {
            const _theme = this.themeService.getTheme();
            const effectiveTheme = this.themeService.getEffectiveTheme();
            document.documentElement.classList.toggle(
              "dark",
              effectiveTheme === "dark"
            );

            const unsubscribe = this.themeService.subscribe(
              (_, effectiveTheme) => {
                document.documentElement.classList.toggle(
                  "dark",
                  effectiveTheme === "dark"
                );
              }
            );

            return () => {
              unsubscribe();
              console.log("Dashboard component will unmount");
            };
          }
        },
        {}
      );

      if (!this.themeService) {
        console.warn("Theme service not available, defaulting to light theme");
      }

      this.render();

      setTimeout(() => {
        this.setupDirectives();
      }, 0);
    } catch (error) {
      console.error("Error in dashboard connectedCallback:", error);
    }
  }

  private setupDirectives() {
    try {
      if (!this.directiveManager) {
        console.warn("DirectiveManager not available");
        return;
      }

      const lazyLoadElements = this.root.querySelectorAll("[lazy-load]");
      if (lazyLoadElements.length > 0) {
        this.directiveManager.applyDirectives(lazyLoadElements);
      }
    } catch (error) {
      console.error("Error setting up directives:", error);
    }
  }

  @EventHandler("click", ".date-range-selector")
  private handleDateRangeClick() {
    console.log("Date range selector clicked");
  }

  @State()
  private activeTab: string = "overview";

  @EventHandler("click", ".tab")
  private handleTabClick(_e: MouseEvent, element: Element) {
    const tabName = element.textContent?.toLocaleLowerCase() || "overview";
    console.log("Tab clicked:", tabName);
    this.activeTab = tabName;
    this.render();
  }

  private getTabContent(tabName: string): string {
    const componentName = tabName.toLowerCase();
    return /* html */ `
      <div 
        lazy-load 
        src-lazy="@/test/components/dashboard/${componentName}.ts"
      >
        <${componentName}-component data-component="${componentName}-component"></${componentName}-component>
      </div>`;
  }

  @Render()
  render() {
    return (this.root.innerHTML = /* html */ `
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
        </style>

        <div class="dashboard">
          <div class="dashboard-header">
            <h1 class="dashboard-title">Dashboard</h1>

            <div class="date-range">
              <div class="date-range-selector">
                <span>${this.dateRange.startDate} - ${
      this.dateRange.endDate
    }</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
              </div>

              <button class="download-btn">Download</button>
            </div>
          </div>
          <div class="tabs">
            <div class="tab ${
              this.activeTab === "overview" ? "active" : ""
            }">Overview</div>
            <div class="tab ${
              this.activeTab === "analytics" ? "active" : ""
            }">Analytics</div>
            <div class="tab ${
              this.activeTab === "reports" ? "active" : ""
            }">Reports</div>
            <div class="tab ${
              this.activeTab === "notifications" ? "active" : ""
            }">Notifications</div>
          </div>
          <div class="tab-content">
          ${this.getTabContent(this.activeTab)}
        </div>
      </div>
    `);
  }
}
