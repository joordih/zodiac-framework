# Zodiac Framework

> ⚠️ **Nota**: Este framework está actualmente en fase de desarrollo activo. Las características y la API pueden cambiar.

Un framework moderno y tipado para crear Web Components con inyección de dependencias, gestión de estado, formularios reactivos, eventos tipados, routing y más.

## Características principales

- 🚀 **Decoradores TypeScript para Web Components**
- 💉 **Sistema de inyección de dependencias con ámbitos**
- 🔄 **Gestión de estado reactivo y hooks**
- 📝 **Sistema de formularios reactivos**
- 🎯 **Sistema de eventos tipados**
- 🛣️ **Router tipado**
- 📏 **Sistema de validación con decoradores**
- 🎨 **Sistema de directivas personalizadas**
- 🔌 **Carga diferida de componentes**
- ⚡ **Middleware para componentes**

## Ejemplos de uso

### Eventos Tipados

```typescript
// Definir los tipos de eventos
interface AppEvents {
  "user-submit": UserFormModel;
  "form-reset": void;
}

// Usar el decorador TypedEvents
@ZodiacComponent("modern-api-card")
@TypedEvents<AppEvents>()
export class ModernApiCard
  extends BaseComponent
  implements TypedEventComponent<AppEvents>
{
  // Los métodos emit, on, once y off se añaden automáticamente
  emit!: <K extends keyof AppEvents>(event: K, data: AppEvents[K]) => void;

  handleSubmit(e: Event) {
    e.preventDefault();
    if (this.form.isValid()) {
      this.emit("user-submit", this.form.getValue());
    }
  }
}
```

### Formularios Reactivos

```typescript
// Modelo con validadores
class UserFormModel {
  @Required
  @MinLength(3)
  name: string = "";

  @Required
  @Email
  email: string = "";
}

// Formulario reactivo
export class ModernApiCard extends BaseComponent {
  private setupForm() {
    const nameControl = new FormControl<string>("", {
      validators: [
        (value) => (!value ? "Name is required" : null),
        (value) =>
          value.length < 3 ? "Name must be at least 3 characters" : null,
      ],
    });

    this.form = new FormGroup<UserFormModel>({
      name: nameControl,
      email: new FormControl(""),
    });

    // Suscripción a cambios
    this.form.subscribeToValue((value) => {
      console.log("Form value changed:", value);
    });
  }
}
```

### Hooks del Sistema

```typescript
export class ModernApiCard extends BaseComponent {
  async connectedCallback() {
    await super.connectedCallback();

    // Estado local con useState
    const [tooltipVisible, setTooltipVisible] = useState(this, false);

    // Efectos con useEffect
    useEffect(
      this,
      () => {
        console.log("Component mounted");
        return () => console.log("Cleanup");
      },
      {}
    );

    // Valores memorizados
    const memoizedValue = useMemo(
      this,
      () => {
        return `Memoized count: ${this.count * 2}`;
      },
      [this.count]
    );

    // Callbacks memorizados
    const handleClick = useCallback(
      this,
      () => {
        console.log("Callback clicked with count:", this.count);
      },
      [this.count]
    );

    // Inyección de servicios con useService
    this.routerService = useService(this, "typed-router-service");
  }
}
```

### Sistema de Directivas

```typescript
export class ModernApiCard extends BaseComponent {
  private setupDirectives() {
    // Aplicar directivas a elementos
    const tooltipElements = this.root.querySelectorAll("[tooltip]");
    const clickOutsideElements = this.root.querySelectorAll("[click-outside]");
    const lazyLoadElements = this.root.querySelectorAll("[lazy-load]");

    this.directiveManager.applyDirectives([
      ...tooltipElements,
      ...clickOutsideElements,
      ...lazyLoadElements,
    ]);
  }

  // Uso en el template
  render() {
    return /* html */ `
      <input 
        tooltip="Enter your full name"
        tooltip-position="top"
        click-outside
        lazy-load
      >
    `;
  }
}
```

### Servicios con Ámbito

```typescript
@Injectable()
@ServiceData({
  token: "api-service",
  scope: InjectionScope.SINGLETON,
})
@Configurable({ baseUrl: "http://localhost:8080/" })
export class ApiService implements IService {
  private config!: { baseUrl: string };

  async onInit(): Promise<void> {
    // Inicialización asíncrona
  }

  async onDestroy(): Promise<void> {
    // Limpieza de recursos
  }
}
```

### Router Tipado

```typescript
@Route("/modern-api")
export class ModernApiCard extends BaseComponent {
  constructor() {
    super(true);
    this.routerService.navigate("/modern-api", {
      params: { id: "123" },
    });
  }
}
```

## Instalación

```bash
~~npm install zodiac-framework~~
```

## Contribución

~~Las contribuciones son bienvenidas. Por favor, revisa las guías de contribución antes de enviar un pull request.~~

## Licencia

MIT

---

Para más información y documentación detallada, visita nuestra ~~[documentación completa](https://github.com/joordih/zodiac-framework/wiki)~~ **PRONTO**.
