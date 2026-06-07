# zodiac-framework

Este proyecto lo hice en mi tiempo libre para entender cómo funcionan por dentro los frameworks modernos de componentes. La idea era implementar desde cero las piezas que normalmente se dan por sentadas: inyección de dependencias, estado reactivo, eventos tipados, routing, formularios, directivas y SSR, todo sobre Web Components nativos sin ninguna dependencia de runtime externa.

No está mantenido y no tiene planes de estarlo. El código refleja el proceso de aprendizaje, no un producto terminado.

-----

## Lo que tiene implementado

- Web Components con `@ZodiacComponent` y Shadow DOM opcional
- Contenedor de inyección de dependencias (`SauceContainer`) con scopes singleton, transient y request
- Estado reactivo con `@State` y estado global con `StateManager`
- Event delegation con `@EventHandler` y eventos tipados entre componentes con `@TypedEvents`
- Router con soporte `history` y `hash`, más un `TypedRouterService` con navegación tipada y guards
- Formularios reactivos con `FormControl` y `FormGroup`, validadores síncronos y asíncronos
- Directivas atributo con `@Directive` y ciclo de vida propio
- Middleware a nivel de método con `createComponentMiddleware`
- Lazy loading de componentes con `@Lazy`
- SSR básico con `happy-dom` y un servidor Express
- Hooks funcionales: `useState`, `useEffect`, `useService`
- Virtual DOM con diff/patch para actualizaciones parciales
- Compiler CLI propio (`zodiac-compiler-v2`) que envuelve Vite

-----

## Requisitos

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

```bash
npm install
npm run dev
```

-----

## Componentes

```typescript
import { BaseComponent } from "@/core/component/baseComponent.ts";
import { ZodiacComponent } from "@/core/component/zodiacComponent.ts";
import { State } from "@/core/states/state.ts";
import { Render } from "@/core/render/vdom.ts";

@ZodiacComponent("user-card")
export class UserCard extends BaseComponent {
  @State()
  private username: string = "anonymous";

  constructor() {
    super(true);
  }

  async connectedCallback() {
    await super.connectedCallback();
    this.render();
  }

  @Render()
  render() {
    return (this.shadowRoot!.innerHTML = `
      <div class="card">
        <span>${this.username}</span>
      </div>
    `);
  }
}
```

`@ZodiacComponent` llama a `customElements.define` y registra la clase en `SauceContainer`. El argumento de `super()` controla si el componente usa Shadow DOM (`true`) o renderiza directamente en el elemento (`false`). `this.root` apunta a lo que corresponda en cada caso.

Cuando una propiedad decorada con `@State()` cambia, se llama `this.render()` automáticamente.

-----

## Inyección de dependencias

```typescript
import { Injectable } from "@/core/injection/injectable.ts";

@Injectable("theme-service")
export class ThemeService {
  private theme: "light" | "dark" = "light";

  getEffectiveTheme(): string {
    return this.theme;
  }

  setTheme(theme: "light" | "dark") {
    this.theme = theme;
  }

  subscribe(callback: (prev: string, next: string) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private listeners: Array<(prev: string, next: string) => void> = [];
}
```

```typescript
import { Inject } from "@/core/injection/inject.ts";
import { ThemeService } from "../services/theme-service.ts";

@ZodiacComponent("app-header")
export class AppHeader extends BaseComponent {
  @Inject("theme-service")
  private themeService!: ThemeService;

  async connectedCallback() {
    await super.connectedCallback();
    console.log(this.themeService.getEffectiveTheme());
  }
}
```

Para servicios que necesitan token explícito y scope:

```typescript
import { ServiceData } from "@/core/services/decorator.ts";
import { InjectionScope } from "@/core/injection/injection-scope.ts";

@ServiceData({
  token: "typed-router-service",
  scope: InjectionScope.SINGLETON,
})
export class TypedRouterService {
  async onInit() {
    window.addEventListener("popstate", () => this.handleLocationChange());
    this.handleLocationChange();
  }
}
```

Registro manual cuando no se usan decoradores:

```typescript
import { SauceContainer } from "@/core/injection/sauceContainer.ts";

SauceContainer.register("typed-router-service", TypedRouterService);
SauceContainer.registerValue("api-url", "https://api.example.com");
SauceContainer.registerFactory("db", (config) => new DbService(config), ["app-config"]);
```

-----

## Estado global

`StateManager` implementa el patrón Observer para compartir estado entre componentes sin que se conozcan entre sí.

```typescript
import { StateManager } from "@/core/states/stateManager.ts";
import { AbstractObserver } from "@/core/states/observer.ts";

const state = StateManager.getInstance();

state.set("theme", "dark");

state.attach({
  update(data: { key: string; newValue: any; oldValue: any }) {
    if (data.key === "theme") {
      document.documentElement.classList.toggle("dark", data.newValue === "dark");
    }
  },
});

const current = state.get<string>("theme");
```

-----

## Eventos

Event delegation por selector con limpieza automática al desconectar:

```typescript
import { EventHandler } from "@/core/events/eventHandler.ts";

@ZodiacComponent("task-list")
export class TaskList extends BaseComponent {
  @EventHandler("click", ".task-checkbox")
  private handleTaskToggle(e: MouseEvent) {
    const taskId = (e.target as HTMLElement).getAttribute("data-task-id");
    console.log("toggled:", taskId);
  }

  @EventHandler("click", ".tab")
  private handleTabClick(_e: MouseEvent, element: Element) {
    this.activeTab = element.textContent?.toLowerCase() ?? "overview";
    this.render();
  }
}
```

Eventos tipados entre componentes:

```typescript
import { TypedEvents } from "@/core/events/typed/typed-event-decorator.ts";
import { TypedEventComponent } from "@/core/events/typed/typed-event-component.ts";

interface DashboardEvents {
  "date-range-change": { startDate: string; endDate: string };
  "metric-click": { metricName: string };
}

@ZodiacComponent("dashboard-component")
@TypedEvents<DashboardEvents>()
export class DashboardComponent extends BaseComponent
  implements TypedEventComponent<DashboardEvents> {

  emit!: <K extends keyof DashboardEvents>(event: K, data: DashboardEvents[K]) => void;
  on!: <K extends keyof DashboardEvents>(event: K, listener: (data: DashboardEvents[K]) => void) => { unsubscribe: () => void };
  off!: <K extends keyof DashboardEvents>(event: K, listener: (data: DashboardEvents[K]) => void) => void;

  private handleMetricClick(name: string) {
    this.emit("metric-click", { metricName: name });
  }
}
```

`@TypedEvents<T>()` inyecta `emit`, `on`, `once` y `off` en `connectedCallback`. Al desconectar, todos los listeners se eliminan.

-----

## Routing

```typescript
import { Route } from "@/core/routing/route.ts";
import { Router } from "@/core/routing/router.ts";

@ZodiacComponent("dashboard-component")
@Route("/dashboard")
export class DashboardComponent extends BaseComponent {}

Router.init({ mode: "history" });
```

El router escucha `popstate`, intercepta clicks en `<a href="...">` y renderiza el componente correspondiente dentro de `<router-view>`.

Router tipado para navegación programática:

```typescript
import { TypedRouterService } from "@/core/router/typed/router-service.ts";
import { TypedRoute } from "@/core/router/typed/route-definition.ts";

const itemRoute: TypedRoute<{ id: string }, { tab?: string }> = {
  path: "/items/:id",
  component: "item-detail",
  title: "Item Detail",
  canActivate: async (_params, _query) => {
    const token = localStorage.getItem("auth_token");
    return token !== null ? true : "/login";
  },
};

this.routerService.registerRoutes([itemRoute]);
this.routerService.navigate(itemRoute, { id: "42" }, { tab: "info" });
```

Devolver un string en `canActivate` redirige a esa ruta.

-----

## Formularios

```typescript
import { FormControl } from "@/core/forms/form-control.ts";
import { FormGroup } from "@/core/forms/form-group.ts";

const required = (value: string) => (value.length > 0 ? null : "Required");
const minLength = (n: number) => (value: string) =>
  value.length >= n ? null : `Minimum ${n} characters`;

const form = new FormGroup({
  username: new FormControl("", {
    validators: [required, minLength(3)],
  }),
  email: new FormControl("", {
    validators: [required],
    asyncValidators: [
      async (value) => {
        const res = await fetch(`/api/check-email?email=${value}`);
        const { available } = await res.json();
        return available ? null : "Email already taken";
      },
    ],
  }),
});

form.subscribeToStatus((status) => {
  const btn = document.querySelector<HTMLButtonElement>("#submit");
  if (btn) btn.disabled = status !== "VALID";
});

form.getControl("username").setValue("jordi");
form.patchValue({ email: "jordi@example.com" });

console.log(form.isValid());
console.log(form.getValue());
console.log(form.getControl("email").getErrors());
```

El flujo de estados de un control es `VALID` -> `PENDING` (mientras se ejecutan async validators) -> `VALID` o `INVALID`.

-----

## Directivas

```typescript
import { Directive } from "@/core/directives/directive.decorator.ts";
import { DirectiveLifecycle } from "@/core/directives/directive.interface.ts";

@Directive({
  selector: "[tooltip]",
  observedAttributes: ["tooltip"],
})
export class TooltipDirective implements DirectiveLifecycle {
  private element: HTMLElement;
  private tip: HTMLElement | null = null;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  onInit() {
    this.tip = document.createElement("div");
    this.tip.className = "zodiac-tooltip";
    this.tip.textContent = this.element.getAttribute("tooltip") ?? "";
    this.element.appendChild(this.tip);
  }

  onAttributeChanged(name: string, _old: string | null, value: string | null) {
    if (name === "tooltip" && this.tip) {
      this.tip.textContent = value ?? "";
    }
  }

  onDestroy() {
    this.tip?.remove();
  }
}
```

`@Directive` empuja la clase al registry global. `DirectiveManager` escanea el DOM y aplica las directivas a los elementos que coincidan con el selector.

-----

## Middleware

```typescript
import { LoggerMiddleware, ErrorBoundaryMiddleware } from "@/core/middleware/middleware.ts";
import { EventHandler } from "@/core/events/eventHandler.ts";

@EventHandler("click", ".submit-btn")
@LoggerMiddleware
@ErrorBoundaryMiddleware
private async handleSubmit(e: MouseEvent) {
  await this.submitForm();
}
```

`LoggerMiddleware` registra nombre del componente, método y tiempo transcurrido. `ErrorBoundaryMiddleware` captura excepciones y renderiza un estado de error en el componente.

Middleware personalizado:

```typescript
import { createComponentMiddleware } from "@/core/middleware/middleware.ts";

const RateLimitMiddleware = createComponentMiddleware(async (context, next) => {
  const key = `rate_${context.componentName}_${context.methodName}`;
  const last = parseInt(sessionStorage.getItem(key) ?? "0");

  if (Date.now() - last < 1000) return;

  sessionStorage.setItem(key, String(Date.now()));
  await next();
});
```

-----

## Lazy loading

```typescript
import { Lazy } from "@/core/lazy/lazy.ts";

@ZodiacComponent("heavy-chart")
@Lazy({
  path: "./components/heavy-chart.ts",
  loading: "loading-spinner",
})
export class HeavyChart extends BaseComponent {}
```

Mientras el módulo no ha cargado se muestra el elemento `loading`. Si no se especifica, se usa un `<div>` vacío.

-----

## Hooks

```typescript
import { useState, useEffect, useService } from "@/core/component/hooks/index.ts";
import { ThemeService } from "../services/theme-service.ts";

async connectedCallback() {
  await super.connectedCallback();

  const [count, setCount] = useState(this, 0);

  const themeService = useService<ThemeService>(this, "theme-service");

  useEffect(this, () => {
    const unsub = themeService.subscribe((_prev, theme) => {
      document.documentElement.className = theme;
    });

    return () => unsub();
  }, {});
}
```

`useState` almacena el estado en un `WeakMap` con la instancia del componente como clave, por lo que cada llamada ocupa un slot estable. `useEffect` ejecuta el cleanup al desconectar el componente.

-----

## SSR

El servidor usa Express y `happy-dom` para simular el DOM en Node.

```typescript
import express from "express";
import { renderToString } from "@/core/ssr/entry.ts";

const app = express();

app.get("*", async (req, res) => {
  const html = await renderToString(req.url);

  const final = html.replace(
    "</body>",
    `<script src="/zodiac.js"></script></body>`
  );

  res.send(final);
});

app.listen(3000);
```

```bash
npm start
```

El `tsconfig.server.json` compila el entry point de servidor por separado.
