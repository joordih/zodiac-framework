import { TypedEventComponent } from "@/core/events/typed/typed-event-component.ts";
import { BaseComponent } from "../../core/component/baseComponent.ts";
import {
  useEffect,
  useMemo,
  useService,
  useState,
} from "../../core/component/hooks/index.ts";
import { ZodiacComponent } from "../../core/component/zodiacComponent.ts";
import { DirectiveManager } from "../../core/directives/directive-manager.ts";
import { EventHandler } from "../../core/events/eventHandler.ts";
import { TypedEvents } from "../../core/events/typed/typed-event-decorator.ts";
import { Injectable } from "../../core/injection/injectable.ts";
import {
  ErrorBoundaryMiddleware,
  LoggerMiddleware,
} from "../../core/middleware/middleware.ts";
import { Render } from "../../core/render/vdom.ts";
import { TypedRouterService } from "../../core/router/typed/router-service.ts";
import { Route } from "../../core/routing/route.ts";
import { State } from "../../core/states/state.ts";
import { ThemeService, ThemeMode } from "../services/theme-service.ts";
import { Inject } from "../../core/injection/inject.ts";

interface AdminEvents {
  "sidebar-toggle": boolean;
  "theme-change": ThemeMode;
  "menu-select": string;
}

@ZodiacComponent("admin-panel")
@Injectable()
@Route("/admin")
@TypedEvents<AdminEvents>()
export class AdminPanel
  extends BaseComponent
  implements TypedEventComponent<AdminEvents>
{
  @State()
  private sidebarCollapsed: boolean = false;

  @State()
  private activeMenuItem: string = "overview";

  @Inject("theme-service")
  private themeService!: ThemeService;

  @Inject("directive-manager")
  private directiveManager!: DirectiveManager;

  @Inject("typed-router-service")
  // @ts-ignore
  private routerService!: TypedRouterService;

  emit!: <K extends keyof AdminEvents>(event: K, data: AdminEvents[K]) => void;
  on!: <K extends keyof AdminEvents>(
    event: K,
    listener: (data: AdminEvents[K]) => void
  ) => { unsubscribe: () => void };
  once!: <K extends keyof AdminEvents>(
    event: K,
    listener: (data: AdminEvents[K]) => void
  ) => { unsubscribe: () => void };
  off!: <K extends keyof AdminEvents>(
    event: K,
    listener: (data: AdminEvents[K]) => void
  ) => void;

  constructor() {
    super(true);
  }

  async connectedCallback() {
    await super.connectedCallback();

    try {
      this.routerService = useService(this, "typed-router-service");
      this.directiveManager = useService(this, "directive-manager");

      const [isMobile, setIsMobile] = useState(this, window.innerWidth < 768);

      if (isMobile) {
        this.sidebarCollapsed = true;
      }

      useEffect(
        this,
        () => {
          const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile !== isMobile) {
              this.sidebarCollapsed = mobile;
              this.render();
            }
          };

          window.addEventListener("resize", handleResize);

          return () => {
            window.removeEventListener("resize", handleResize);
          };
        },
        {}
      );

      useEffect(
        this,
        () => {
          const currentTheme = this.themeService.getTheme();
          const effectiveTheme = this.themeService.getEffectiveTheme();
          console.log(
            `AdminPanel: Initial theme is ${currentTheme}, effective theme is ${effectiveTheme}`
          );

          if (effectiveTheme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }

          const unsubscribe = this.themeService.subscribe(
            (theme, effectiveTheme) => {
              console.log(
                `AdminPanel: Theme changed to ${theme}, effective theme is ${effectiveTheme}`
              );
              this.render();
            }
          );

          return () => {
            unsubscribe();
          };
        },
        {}
      );

      this.render();

      setTimeout(() => {
        this.setupDirectives();
      }, 0);
    } catch (error) {
      console.error("Error in connectedCallback:", error);
    }
  }

  async disconnectedCallback() {
    try {
      if (this.directiveManager) {
        this.directiveManager.destroyDirectives(this.root);
      }

      await super.disconnectedCallback();
    } catch (error) {
      console.error("Error in disconnectedCallback:", error);
    }
  }

  private setupDirectives() {
    try {
      if (!this.directiveManager) {
        console.warn("DirectiveManager not available");
        return;
      }

      const tooltipElements = this.root.querySelectorAll("[tooltip]");
      if (tooltipElements.length > 0) {
        this.directiveManager.applyDirectives(tooltipElements);
      }

      const clickOutsideElements =
        this.root.querySelectorAll("[click-outside]");
      if (clickOutsideElements.length > 0) {
        this.directiveManager.applyDirectives(clickOutsideElements);
      }

      const lazyLoadElements = this.root.querySelectorAll("[lazy-load]");
      if (lazyLoadElements.length > 0) {
        this.directiveManager.applyDirectives(lazyLoadElements);
      }
    } catch (error) {
      console.error("Error setting up directives:", error);
    }
  }

  @EventHandler("click", "#toggle-sidebar")
  @LoggerMiddleware
  @ErrorBoundaryMiddleware
  // @ts-ignore
  private handleSidebarToggle(_e: MouseEvent) {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.emit("sidebar-toggle", this.sidebarCollapsed);
    this.render();
  }

  @EventHandler("click", "#theme-toggle")
  @LoggerMiddleware
  @ErrorBoundaryMiddleware
  // @ts-ignore
  private handleThemeToggle(_e: MouseEvent) {
    this.themeService.toggleTheme();
    const newTheme = this.themeService.getTheme();
    const effectiveTheme = this.themeService.getEffectiveTheme();

    console.log(
      `Theme toggled to: ${newTheme}, effective theme: ${effectiveTheme}`
    );

    if (effectiveTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    if (effectiveTheme === "dark") {
      (this.root as ShadowRoot).host.classList.add("dark");
    } else {
      (this.root as ShadowRoot).host.classList.remove("dark");
    }

    this.emit("theme-change", newTheme);
    this.render();
  }

  @EventHandler("click", ".menu-item")
  @LoggerMiddleware
  @ErrorBoundaryMiddleware
  // @ts-ignore
  private handleMenuSelect(e: MouseEvent) {
    const menuItem = (e.target as HTMLElement).closest(".menu-item");
    if (menuItem) {
      const menuId = menuItem.getAttribute("data-id");
      if (menuId) {
        this.activeMenuItem = menuId;
        this.emit("menu-select", menuId);

        if (window.innerWidth < 768) {
          this.sidebarCollapsed = true;
        }

        this.render();
      }
    }
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
    try {
      const currentTheme = this.themeService.getTheme();
      const themeIcon = useMemo(
        this,
        () => {
          switch (currentTheme) {
            case "light":
              return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
            case "dark":
              return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
            case "system":
              return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="14" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 11h10"/><path d="M7 15h10"/><path d="M12 19v2"/><path d="M8 21h8"/></svg>`;
          }
        },
        [currentTheme]
      );

      const menuItems = [
        {
          id: "overview",
          label: "Overview",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,
        },
        {
          id: "users",
          label: "Users",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        },
        {
          id: "settings",
          label: "Settings",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
        },
        {
          id: "analytics",
          label: "Analytics",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-4 4"/></svg>`,
        },
        {
          id: "content",
          label: "Content",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
        },
      ];

      const menuHTML = menuItems
        .map((item) => {
          const isActive = this.activeMenuItem === item.id;
          return `
          <div class="menu-item ${isActive ? "active" : ""}" data-id="${
            item.id
          }">
            <div class="menu-icon">${item.icon}</div>
            <span class="menu-label">${item.label}</span>
          </div>
        `;
        })
        .join("");

      return (this.root.innerHTML = /* html */ `
        <div class="admin-panel ${
          this.sidebarCollapsed ? "sidebar-collapsed" : ""
        }">
          <style>
            .admin-panel {
              --background: hsl(0, 0%, 100%);
              --foreground: hsl(240, 10%, 3.9%);
              --card: hsl(0, 0%, 100%);
              --card-foreground: hsl(240, 10%, 3.9%);
              --popover: hsl(0, 0%, 100%);
              --popover-foreground: hsl(240, 10%, 3.9%);
              --primary: hsl(240, 5.9%, 10%);
              --primary-foreground: hsl(0, 0%, 98%);
              --secondary: hsl(240, 4.8%, 95.9%);
              --secondary-foreground: hsl(240, 5.9%, 10%);
              --muted: hsl(240, 4.8%, 95.9%);
              --muted-foreground: hsl(240, 3.8%, 46.1%);
              --accent: hsl(240, 4.8%, 95.9%);
              --accent-foreground: hsl(240, 5.9%, 10%);
              --destructive: hsl(0, 84.2%, 60.2%);
              --destructive-foreground: hsl(0, 0%, 98%);
              --border: hsl(240, 5.9%, 90%);
              --input: hsl(240, 5.9%, 90%);
              --ring: hsl(240, 5.9%, 10%);
              --radius: 0.5rem;
              --chart-bars: hsl(240, 10%, 3.9%);
              --chart-bars-accent: hsl(240, 8.30%, 14.10%);
              --text-color: hsl(240, 10%, 3.9%);
              
              display: grid;
              grid-template-columns: auto 1fr;
              min-height: 100vh;
              width: 100%;
              background-color: var(--background);
              color: var(--foreground);
              font-family: system-ui, -apple-system, sans-serif;
              transition: all 0.3s ease;
            }
            
            .admin-panel.sidebar-collapsed {
              grid-template-columns: 60px 1fr;
            }
            
            :host-context(html.dark) .admin-panel,
            :host-context(.dark) .admin-panel,
            .dark .admin-panel,
            html.dark .admin-panel {
              --background: hsl(240, 10%, 3.9%);
              --foreground: hsl(0, 0%, 98%);
              --card: hsl(240, 10%, 3.9%);
              --card-foreground: hsl(0, 0%, 98%);
              --popover: hsl(240, 10%, 3.9%);
              --popover-foreground: hsl(0, 0%, 98%);
              --primary: hsl(0, 0%, 98%);
              --primary-foreground: hsl(240, 5.9%, 10%);
              --secondary: hsl(240, 3.7%, 15.9%);
              --secondary-foreground: hsl(0, 0%, 98%);
              --muted: hsl(240, 3.7%, 15.9%);
              --muted-foreground: hsl(240, 5%, 64.9%);
              --accent: hsl(240, 3.7%, 15.9%);
              --accent-foreground: hsl(0, 0%, 98%);
              --destructive: hsl(0, 62.8%, 30.6%);
              --destructive-foreground: hsl(0, 0%, 98%);
              --border: hsl(240, 3.7%, 15.9%);
              --input: hsl(240, 3.7%, 15.9%);
              --ring: hsl(240, 4.9%, 83.9%);
              --text-color: hsl(0, 0%, 98%);
              --bg-color: hsl(240, 10%, 3.9%);
              --card-bg: hsl(240, 10%, 3.9%);
              --border-color: hsl(240, 10%, 10%);
              --muted-color: hsl(240, 5%, 64.9%);
              --primary-color: hsl(142.1, 76.2%, 36.3%);
              --chart-bars: hsl(0, 0%, 98%);
            }
            
            *, *::before, *::after {
              box-sizing: border-box;
            }
            
            .sidebar {
              background-color: var(--card);
              border-right: 1px solid var(--border);
              height: 100vh;
              overflow-y: auto;
              display: flex;
              flex-direction: column;
              transition: all 0.3s ease;
              width: 250px;
              position: sticky;
              top: 0;
            }
            
            .sidebar-collapsed .sidebar {
              width: 60px;
            }
            
            .sidebar-header {
              padding: 1rem;
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 1px solid var(--border);
            }
            
            .logo {
              font-weight: 700;
              font-size: 1.25rem;
              color: var(--foreground);
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            
            .sidebar-collapsed .logo-text {
              display: none;
            }
            
            .toggle-btn {
              background: transparent;
              border: none;
              color: var(--foreground);
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 28px;
              height: 28px;
              border-radius: var(--radius);
              transition: background-color 0.2s ease;
            }
            
            .toggle-btn:hover {
              background-color: var(--secondary);
            }
            
            .sidebar-menu {
              display: flex;
              flex-direction: column;
              padding: 1rem 0.5rem;
              flex: 1;
            }
            
            .menu-item {
              display: flex;
              align-items: center;
              padding: 0.75rem;
              border-radius: var(--radius);
              cursor: pointer;
              margin-bottom: 0.25rem;
              transition: all 0.2s ease;
              color: var(--muted-foreground);
            }
            
            .menu-item:hover {
              background-color: var(--secondary);
              color: var(--foreground);
            }
            
            .menu-item.active {
              background-color: var(--secondary);
              color: var(--foreground);
              font-weight: 500;
            }
            
            .menu-icon {
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 0.75rem;
            }
            
            .sidebar-collapsed .menu-label {
              display: none;
            }
            
            .main-content {
              padding: 1.5rem;
              overflow-y: auto;
            }
            
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 2rem;
              padding-bottom: 1rem;
              border-bottom: 1px solid var(--border);
            }
            
            .page-title {
              font-size: 1.5rem;
              font-weight: 600;
              color: var(--foreground);
            }
            
            .header-actions {
              display: flex;
              gap: 0.5rem;
            }
            
            .theme-toggle {
              background: transparent;
              border: 1px solid var(--border);
              color: var(--foreground);
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 36px;
              height: 36px;
              border-radius: var(--radius);
              transition: all 0.2s ease;
            }
            
            .theme-toggle:hover {
              background-color: var(--secondary);
            }
            
            .content-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
              gap: 1.5rem;
            }
            
            .card {
              background-color: var(--card);
              border-radius: var(--radius);
              border: 1px solid var(--border);
              padding: 1.5rem;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            
            .card-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 1rem;
            }
            
            .card-title {
              font-size: 1.1rem;
              font-weight: 600;
              color: var(--foreground);
            }
            
            .card-content {
              color: var(--muted-foreground);
            }
            
            @media (max-width: 768px) {
              .content-grid {
                grid-template-columns: 1fr;
              }
              
              .header {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
              }
              
              .header-actions {
                width: 100%;
                justify-content: flex-end;
              }
            }
          </style>
          
          <div class="sidebar">
            <div class="sidebar-header">
              <div class="logo">
                <span class="logo-text">Zodiac Admin</span>
              </div>
              <button id="toggle-sidebar" class="toggle-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
              </button>
            </div>
            <div class="sidebar-menu">
              ${menuHTML}
            </div>
          </div>
          
          <div class="main-content">
            <div class="header">
              <h1 class="page-title">${
                this.activeMenuItem.charAt(0).toUpperCase() +
                this.activeMenuItem.slice(1)
              }</h1>
              <div class="header-actions">
                <button id="theme-toggle" class="theme-toggle">
                  ${themeIcon}
                </button>
              </div>
            </div>

            <div class="tab-content">
              ${this.getTabContent(this.activeMenuItem)}
            </div>
            
            <!-- <div class="content-grid"> -->

              <!-- <div class="card">
                <div class="card-header">
                  <h2 class="card-title">Welcome to Zodiac Admin</h2>
                </div>
                <div class="card-content">
                  <p>This is a demo of the Zodiac Framework admin panel with dark mode support.</p>
                  <p>Current theme: ${currentTheme}</p>
                </div>
              </div>
              
              <div class="card">
                <div class="card-header">
                  <h2 class="card-title">Features</h2>
                </div>
                <div class="card-content">
                  <p>• Responsive design</p>
                  <p>• Dark mode support</p>
                  <p>• Collapsible sidebar</p>
                  <p>• Theme persistence</p>
                </div>
              </div>
              
              <div class="card">
                <div class="card-header">
                  <h2 class="card-title">Theme System</h2>
                </div>
                <div class="card-content">
                  <p>The theme system uses CSS variables and the <code>html.dark</code> class to style components.</p>
                  <p>Click the theme toggle button to cycle through light, dark, and system themes.</p>
                </div>
              </div>
            </div>
          </div> -->
        </div>
      `);
    } catch (error: any) {
      console.error("Error in render:", error);
      return (this.root.innerHTML = `<div>Error rendering component: ${error.message}</div>`);
    }
  }
}
