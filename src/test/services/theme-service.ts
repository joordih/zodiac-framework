import { IService } from "../../core/services/service.ts";
import { ServiceData } from "../../core/services/decorator.ts";
import { InjectionScope } from "../../core/injection/injection-scope.ts";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeChangeListener {
  (theme: ThemeMode, effectiveTheme: "light" | "dark"): void;
}

@ServiceData({
  token: "theme-service",
  scope: InjectionScope.SINGLETON,
})
export class ThemeService implements IService {
  private theme: ThemeMode = "system";
  private listeners: ThemeChangeListener[] = [];
  private mediaQuery: MediaQueryList;

  constructor() {
    this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this.initialize();
  }

  private initialize(): void {
    const savedTheme = localStorage.getItem("zodiac-theme");
    if (savedTheme && (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system")) {
      this.theme = savedTheme as ThemeMode;
    }

    this.mediaQuery.addEventListener("change", this.handleSystemThemeChange.bind(this));

    this.applyTheme();
  }

  private handleSystemThemeChange(): void {
    if (this.theme === "system") {
      this.applyTheme();
    }
  }

  private applyTheme(): void {
    const effectiveTheme = this.getEffectiveTheme();
    
    if (effectiveTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    this.notifyListeners();
  }

  public getTheme(): ThemeMode {
    return this.theme;
  }

  public getEffectiveTheme(): "light" | "dark" {
    if (this.theme === "system") {
      return this.mediaQuery.matches ? "dark" : "light";
    }
    return this.theme;
  }

  public setTheme(theme: ThemeMode): void {
    if (this.theme !== theme) {
      this.theme = theme;
      localStorage.setItem("zodiac-theme", theme);
      this.applyTheme();
    }
  }

  public toggleTheme(): void {
    if (this.theme === "light") {
      this.setTheme("dark");
    } else if (this.theme === "dark") {
      this.setTheme("system");
    } else {
      this.setTheme("light");
    }
  }

  public subscribe(listener: ThemeChangeListener): () => void {
    this.listeners.push(listener);
    
    listener(this.theme, this.getEffectiveTheme());
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    const effectiveTheme = this.getEffectiveTheme();
    this.listeners.forEach(listener => {
      listener(this.theme, effectiveTheme);
    });
  }

  async register(): Promise<void> {
    console.log("ThemeService registered");
  }

  async unregister(): Promise<void> {
    this.mediaQuery.removeEventListener("change", this.handleSystemThemeChange.bind(this));
  }
}