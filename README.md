# Zodiac Framework

> ⚠️ **Nota**: Este framework está actualmente en fase de desarrollo activo. Las características y la API pueden cambiar.

Un framework moderno y tipado para crear Web Components con inyección de dependencias, gestión de estado, formularios reactivos, eventos tipados, routing, SSR y más.

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
- 🖥️ **Server Side Rendering (SSR)**
- 🎭 **Sistema de estados global**

## Ejemplos de uso detallados

### Gestión de Estado Global

```typescript
// Definición del estado global
interface GlobalState {
  user: {
    name: string;
    isAuthenticated: boolean;
  };
  theme: 'light' | 'dark';
}

// Uso en componentes
@ZodiacComponent("app-header")
export class AppHeader extends BaseComponent {
  private stateManager = StateManager.getInstance();

  async connectedCallback() {
    await super.connectedCallback();
    
    // Suscripción a cambios específicos
    this.stateManager.attach(new class extends AbstractObserver {
      update(data: { key: string; newValue: any }) {
        if (data.key === 'theme') {
          this.updateTheme(data.newValue);
        }
      }
    }(this.stateManager));
    
    // Actualizar estado
    this.stateManager.set('theme', 'dark');
  }
}
```

### Sistema de Formularios Avanzado

```typescript
// Modelo de formulario con validación avanzada
class RegistrationForm {
  @Required()
  @MinLength(3)
  username: string = "";

  @Required()
  @Email()
  email: string = "";

  @Required()
  @Pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)
  password: string = "";

  @Custom((value, form) => value === form.get('password').value)
  confirmPassword: string = "";
}

// Implementación en componente
@ZodiacComponent("registration-form")
export class RegistrationFormComponent extends BaseComponent {
  private form!: FormGroup<RegistrationForm>;

  async connectedCallback() {
    await super.connectedCallback();
    this.setupForm();
  }

  private setupForm() {
    this.form = new FormGroup<RegistrationForm>({
      username: new FormControl(""),
      email: new FormControl(""),
      password: new FormControl(""),
      confirmPassword: new FormControl("")
    });

    // Validación asíncrona
    this.form.getControl("username").setAsyncValidator(async (value) => {
      const response = await fetch(`/api/check-username/${value}`);
      const isAvailable = await response.json();
      return isAvailable ? null : "Username already taken";
    });

    // Suscripción a cambios de estado
    this.form.subscribeToStatus((status) => {
      const submitButton = this.root.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = status !== 'VALID';
      }
    });
  }
}
```

### Server Side Rendering (SSR)

```typescript
// Componente con soporte SSR
@ZodiacComponent("product-card")
@SSREnabled()
export class ProductCard extends BaseComponent {
  @State()
  private product: Product | null = null;

  async connectedCallback() {
    await super.connectedCallback();
    
    if (isSSR()) {
      // Fetch datos durante SSR
      this.product = await this.fetchProductData();
    } else {
      // Hidratación en cliente
      this.hydrateFromSSRData();
    }
  }

  private async fetchProductData(): Promise<Product> {
    // Implementación de fetch para SSR
    return await fetch('/api/product/1').then(r => r.json());
  }

  @Render()
  render() {
    if (!this.product) return '<div>Loading...</div>';

    return /* html */ `
      <div class="product-card" data-ssr-id="${this.product.id}">
        <h2>${this.product.name}</h2>
        <p>${this.product.description}</p>
        <span class="price">${this.product.price}</span>
      </div>
    `;
  }
}

// Configuración del servidor SSR
import { SSREngine, SSRMiddleware } from 'zodiac-framework/ssr';

const ssrEngine = new SSREngine({
  components: [ProductCard],
  polyfills: true,
  middleware: [
    new SSRMiddleware({
      cache: true,
      timeout: 5000
    })
  ]
});

// Express middleware ejemplo
app.use(async (req, res, next) => {
  try {
    const html = await ssrEngine.renderToString(`
      <product-card data-ssr="true"></product-card>
    `);
    res.send(html);
  } catch (error) {
    next(error);
  }
});
```

### Sistema de Directivas Avanzado

```typescript
// Directiva personalizada
@Directive({
  selector: "[tooltip]",
  observedAttributes: ["tooltip", "tooltip-position"]
})
export class TooltipDirective implements DirectiveLifecycle {
  private tooltipElement?: HTMLElement;
  private position: 'top' | 'bottom' | 'left' | 'right' = 'top';

  onInit(element: HTMLElement): void {
    this.setupTooltip(element);
  }

  onAttributeChanged(name: string, oldValue: string, newValue: string): void {
    if (name === 'tooltip-position') {
      this.position = newValue as any;
      this.updatePosition();
    }
  }

  private setupTooltip(element: HTMLElement): void {
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.classList.add('zodiac-tooltip');
    // Implementación del tooltip
  }
}

// Uso en componente
@ZodiacComponent("feature-component")
export class FeatureComponent extends BaseComponent {
  @Render()
  render() {
    return /* html */ `
      <button 
        tooltip="Característica premium"
        tooltip-position="top"
        class="feature-button">
        Activar
      </button>
    `;
  }
}
```

### Middleware para Componentes

```typescript
// Middleware de autenticación
export class AuthMiddleware implements ComponentMiddleware {
  async beforeMount(component: BaseComponent): Promise<boolean> {
    const authService = useService(component, 'auth-service');
    const isAuthenticated = await authService.checkAuth();
    
    if (!isAuthenticated) {
      const router = useService(component, 'router-service');
      router.navigate('/login');
      return false;
    }
    
    return true;
  }
}

// Uso en componente
@ZodiacComponent("protected-component")
@UseMiddleware(AuthMiddleware)
export class ProtectedComponent extends BaseComponent {
  // Componente protegido
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
