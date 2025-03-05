# Zodiac Framework

> ⚠️ **Nota**: Este framework está actualmente en fase de desarrollo activo. Las características y la API pueden cambiar.

Un framework ligero y moderno para crear Web Components con inyección de dependencias, gestión de estado y manejo de eventos de forma elegante.

## Características principales

- 🚀 **Decoradores TypeScript para Web Components**
- 💉 **Sistema de inyección de dependencias**
- 🔄 **Gestión de estado reactivo**
- 🎯 **Manejo de eventos declarativo**
- ⚙️ **Servicios configurables**
- 🎨 **Estilizado encapsulado**

## Uso básico

### Crear un componente

```typescript
import { BaseComponent } from "@/core/component/baseComponent";
import { ZodiacComponent } from "@/core/component/zodiacComponent";
import { State } from "@/core/states/state";
import { Event } from "@/core/events/event";
import { EventHandler } from "@/core/events/eventHandler";

@ZodiacComponent("my-counter")
export class MyCounter extends BaseComponent {
  @State()
  private count: number = 0;

  @Event("counter-changed")
  private counterChange!: (detail: { count: number }) => void;

  constructor() {
    super(true);
  }

  @EventHandler("click", "#increment")
  private handleIncrement(_e: MouseEvent) {
    this.count++;
    this.render();
  }

  render() {
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
        <h1>Count: ${this.count}</h1>
        <button id="increment">Increment</button>
      </div>
    `;
  }
}
```

### Crear un servicio

```typescript
import { Injectable } from "@/core/injection/injectable";
import { Configurable } from "@/core/configurable";
import { IService } from "@/core/services/service";
import { ServiceData } from "@/core/services/decorator";

@Injectable("ApiService")
@ServiceData("api-service")
@Configurable({ baseUrl: "http://localhost:8080/" })
export class ApiService implements IService {
  private config!: { baseUrl: string };

  constructor() {
    this.config = (this as any).__config__;
  }

  register(): void {
    console.log("ApiService registered!");
  }

  unregister(): void {
    console.log("ApiService unregistered!");
  }

  fetchData(): void {
    console.log(`Fetching data from ${this.config.baseUrl}`);
  }
}
```

### Inyección de dependencias en componentes

```typescript
import { Inject } from "@/core/injection/inject";

@ZodiacComponent("api-card")
@Injectable()
export class ApiCard extends BaseComponent {
  @Inject()
  private apiService!: ApiService;

  @EventHandler("click", "#fetch-data")
  private handleFetch() {
    this.apiService.fetchData();
  }
}
```

## Características detalladas

### Decoradores disponibles

- `@ZodiacComponent(name)`: Define un Web Component
- `@Injectable()`: Marca una clase como inyectable
- `@Inject()`: Inyecta una dependencia
- `@State()`: Define una propiedad reactiva
- `@Event(name)`: Define un evento personalizado
- `@EventHandler(event, selector)`: Maneja eventos del DOM
- `@Configurable(config)`: Permite configuración de servicios
- `@ServiceData(name)`: Define metadatos del servicio

### Ciclo de vida

Los componentes heredan de `BaseComponent` que proporciona:
- `constructor`: Inicialización del componente
- `connectedCallback`: Cuando el componente se monta en el DOM
- `render`: Método para actualizar la vista

## Contribución

Las contribuciones son bienvenidas. Por favor, revisa las guías de contribución antes de enviar un pull request.

## Licencia

MIT

---

Para más información y documentación detallada, visita nuestra [documentación completa](https://github.com/joordih/zodiac-framework/wiki).
