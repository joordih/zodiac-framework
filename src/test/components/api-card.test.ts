import { TypedEventComponent } from "@/core/events/typed/typed-event-component.ts";
import { FormControl } from "@/core/forms/form-control.ts";
import { FormGroup } from "@/core/forms/form-group.ts";
import { BaseComponent } from "../../core/component/baseComponent.ts";
import {
  useCallback,
  useEffect,
  useMemo,
  useService,
  useState,
} from "../../core/component/hooks/index.ts";
import { ZodiacComponent } from "../../core/component/zodiacComponent.ts";
import { DirectiveManager } from "../../core/directives/directive-manager.ts";
import { Event } from "../../core/events/event.ts";
import { EventHandler } from "../../core/events/eventHandler.ts";
import { TypedEvents } from "../../core/events/typed/typed-event-decorator.ts";
import { Inject } from "../../core/injection/inject.ts";
import { Injectable } from "../../core/injection/injectable.ts";
import {
  ErrorBoundaryMiddleware,
  LoggerMiddleware,
} from "../../core/middleware/middleware.ts";
import { Render } from "../../core/render/vdom.ts";
import { TypedRouterService } from "../../core/router/typed/router-service.ts";
import { Route } from "../../core/routing/route.ts";
import { State } from "../../core/states/state.ts";
import {
  Email,
  MinLength,
  Required,
} from "../../core/validation/validators.ts";
import { ApiService } from "../services/api-data.test.ts";

class UserFormModel {
  @Required
  @MinLength(3)
  name: string = "";

  @Required
  @Email
  email: string = "";
}

interface AppEvents {
  "user-submit": UserFormModel;
  "form-reset": void;
}

@ZodiacComponent("modern-api-card")
@Injectable()
@Route("/modern-api")
@TypedEvents<AppEvents>()
export class ModernApiCard
  extends BaseComponent
  implements TypedEventComponent<AppEvents>
{
  @State()
  private count: number = 0;

  @Event("counter-changed")
  private counterChange!: (detail: { count: number }) => void;

  @Inject("api-service")
  private apiService!: ApiService;

  private form!: FormGroup<UserFormModel>;
  private directiveManager!: DirectiveManager;
  private routerService!: TypedRouterService;
  private showTooltip: boolean = false;

  emit!: <K extends keyof AppEvents>(event: K, data: AppEvents[K]) => void;
  on!: <K extends keyof AppEvents>(
    event: K,
    listener: (data: AppEvents[K]) => void
  ) => { unsubscribe: () => void };
  once!: <K extends keyof AppEvents>(
    event: K,
    listener: (data: AppEvents[K]) => void
  ) => { unsubscribe: () => void };
  off!: <K extends keyof AppEvents>(
    event: K,
    listener: (data: AppEvents[K]) => void
  ) => void;

  constructor() {
    super(true);
    this.setupForm();
  }

  async connectedCallback() {
    await super.connectedCallback();

    try {
      this.routerService = useService(this, "typed-router-service");
      this.directiveManager = useService(this, "directive-manager");

      const [tooltipVisible, setTooltipVisible] = useState(this, false);
      this.showTooltip = tooltipVisible;

      useEffect(
        this,
        () => {
          console.log("Component mounted with count:", this.count);

          return () => {
            console.log("Component will unmount, cleaning up...");
          };
        },
        {}
      );

      useEffect(
        this,
        () => {
          console.log("Count changed to:", this.count);
        },
        { deps: [this.count] }
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
      if (this.form) {
        const unsubscribe = this.form.subscribeToValue(() => {});
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      }

      if (this.directiveManager) {
        this.directiveManager.destroyDirectives(this.root);
      }

      await super.disconnectedCallback();
    } catch (error) {
      console.error("Error in disconnectedCallback:", error);
    }
  }

  private setupForm() {
    try {
      const nameControl = new FormControl<string>("", {
        validators: [
          (value) => (!value ? "Name is required" : null),
          (value) =>
            value && value.length < 3
              ? "Name must be at least 3 characters"
              : null,
        ],
      });

      const emailControl = new FormControl<string>("", {
        validators: [
          (value) => (!value ? "Email is required" : null),
          (value) =>
            value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
              ? "Invalid email format"
              : null,
        ],
      });

      this.form = new FormGroup<UserFormModel>({
        name: nameControl,
        email: emailControl,
      });

      this.form.subscribeToValue((value) => {
        console.log("Form value changed:", value);
      });

      this.form.subscribeToStatus((status) => {
        console.log("Form status changed:", status);
      });
    } catch (error) {
      console.error("Error setting up form:", error);
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

  @EventHandler("click", "#increment")
  @LoggerMiddleware
  @ErrorBoundaryMiddleware
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

  @EventHandler("submit", "form")
  private handleSubmit(e: Event) {
    e.preventDefault();

    if (this.form && this.form.isValid()) {
      const formData = this.form.getValue();
      this.emit("user-submit", formData);
      console.log("Form submitted with valid data:", formData);
    } else {
      console.error("Form has validation errors");
    }
  }

  @EventHandler("click", "#reset-form")
  private handleReset() {
    if (this.form) {
      this.form.reset();
      this.emit("form-reset", undefined);
    }
  }

  @EventHandler("click", "#outside-test")
  private handleClickOutside() {
    console.log("Clicked outside the element!");
  }

  @EventHandler("input", "#name-input")
  private handleNameInput(e: Event) {
    if (!this.form) return;

    const input = e.target as HTMLInputElement;
    if (input && input.value !== undefined) {
      this.form.getControl("name").setValue(input.value);
    }
  }

  @EventHandler("input", "#email-input")
  private handleEmailInput(e: Event) {
    if (!this.form) return;

    const input = e.target as HTMLInputElement;
    if (input && input.value !== undefined) {
      this.form.getControl("email").setValue(input.value);
    }
  }

  @Render()
  render() {
    try {
      const formValue = this.form
        ? this.form.getValue()
        : { name: "", email: "" };
      const nameErrors = this.form
        ? this.form.getControl("name").getErrors()
        : [];
      const emailErrors = this.form
        ? this.form.getControl("email").getErrors()
        : [];

      const memoizedValue = useMemo(
        this,
        () => {
          return `Memoized count: ${this.count * 2}`;
        },
        [this.count]
      );

      const handleClick = useCallback(
        this,
        () => {
          console.log("Callback clicked with count:", this.count);
        },
        [this.count]
      );

      return (this.root.innerHTML = /* html */ `
        <div class="modern-api-card">
        <style>
          .modern-api-card {
              --background: hsl(240, 10%, 3.9%);
              --foreground: hsl(0, 0%, 98%);
              --card: hsl(240, 10%, 7%);
              --card-foreground: hsl(0, 0%, 98%);
              --popover: hsl(240, 10%, 7%);
              --popover-foreground: hsl(0, 0%, 98%);
              --primary: hsl(240, 5.9%, 10%);
              --primary-foreground: hsl(0, 0%, 98%);
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
              --radius: 0.5rem;
              
              display: block;
              padding: 1.5rem;
              background: var(--card);
              color: var(--card-foreground);
              border-radius: var(--radius);
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 500px;
              width: 100%;
              margin: 0 auto;
              box-sizing: border-box;
            }
            
            /* Aseguramos que todos los elementos respeten el box-sizing */
            *, *::before, *::after {
              box-sizing: border-box;
            }
            
            h1 {
              color: var(--foreground);
              font-size: 1.8rem;
              margin-bottom: 1rem;
              text-align: center;
              font-weight: 600;
            }
            
            .button-group {
              display: flex;
              gap: 0.8rem;
              justify-content: center;
              margin-bottom: 2rem;
              flex-wrap: wrap;
            }
            
            button {
              padding: 0.6rem 1.2rem;
              cursor: pointer;
              border: none;
              border-radius: var(--radius);
              font-weight: 500;
              transition: all 0.2s ease;
            }
            
            #increment {
              background: hsl(217, 91%, 60%);
              color: white;
            }
            
            #increment:hover {
              background: hsl(217, 91%, 55%);
            }
            
            #decrement {
              background: hsl(0, 84%, 60%);
              color: white;
            }
            
            #decrement:hover {
              background: hsl(0, 84%, 55%);
            }
            
            .form-group {
              margin-bottom: 1.2rem;
              width: 100%;
            }
            
            label {
              display: block;
              margin-bottom: 0.5rem;
              font-weight: 500;
              color: var(--foreground);
            }
            
            input {
              width: 100%;
              padding: 0.8rem;
              border: 1px solid var(--border);
              background-color: var(--input);
              color: var(--foreground);
              border-radius: var(--radius);
              font-size: 1rem;
              max-width: 100%;
            }
            
            input:focus {
              outline: none;
              border-color: hsl(217, 91%, 60%);
              box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
            }
            
            input::placeholder {
              color: var(--muted-foreground);
            }
            
            .error {
              color: hsl(0, 84%, 60%);
              font-size: 0.85rem;
              margin-top: 0.4rem;
            }
            
            .form-actions {
              display: flex;
              justify-content: space-between;
              margin-top: 1.5rem;
              flex-wrap: wrap;
              gap: 0.8rem;
            }
            
            .submit-btn {
              background: hsl(142, 71%, 45%);
              color: hsl(240, 10%, 3.9%);
              font-weight: 600;
              flex: 1;
            }
            
            .submit-btn:hover {
              background: hsl(142, 71%, 40%);
            }
            
            .reset-btn {
              background: var(--secondary);
              color: var(--secondary-foreground);
              flex: 1;
            }
            
            .reset-btn:hover {
              background: hsl(240, 3.7%, 20%);
            }
            
            .card-section {
              padding: 1rem;
              margin-bottom: 1rem;
              border: 1px solid var(--border);
              border-radius: var(--radius);
              background: var(--primary);
              width: 100%;
              overflow: hidden;
            }
            
            .card-section h2 {
              font-size: 1.2rem;
              margin-bottom: 0.8rem;
              color: var(--foreground);
              font-weight: 600;
            }
            
            .clickable-area {
              padding: 1rem;
              background: var(--secondary);
              border-radius: var(--radius);
              text-align: center;
              cursor: pointer;
              margin-top: 1rem;
              transition: background-color 0.2s ease;
              word-wrap: break-word;
            }
            
            .clickable-area:hover {
              background: var(--accent);
            }
            
            p {
              color: var(--foreground);
              word-wrap: break-word;
            }
            
            /* Media queries para responsividad */
            @media (max-width: 600px) {
              .modern-api-card {
                padding: 1rem;
              }
              
              h1 {
                font-size: 1.5rem;
              }
              
              .card-section {
                padding: 0.8rem;
              }
              
              .form-actions {
                flex-direction: column;
              }
              
              button {
                width: 100%;
              }
            }
            
            @media (max-width: 400px) {
              h1 {
                font-size: 1.3rem;
              }
              
              .card-section h2 {
                font-size: 1.1rem;
              }
              
              input {
                padding: 0.6rem;
              }
            }
          </style>
          
          <h1>Modern Zodiac Framework Demo</h1>
          
          <div class="card-section">
            <h2>Counter with Hooks: ${this.count}</h2>
            <div class="button-group">
              <button id="increment" type="button">Increment</button>
              <button id="decrement" type="button">Fetch Data</button>
            </div>
            <p>${memoizedValue}</p>
          </div>
          
          <div class="card-section">
            <h2>Reactive Form with Validation</h2>
            <form>
              <div class="form-group">
                <label for="name-input">Name</label>
                <input 
                  id="name-input" 
                  type="text" 
                  value="${formValue.name}" 
                  placeholder="Enter your name"
                  tooltip="Enter your full name"
                  tooltip-position="top"
                >
                ${
                  nameErrors.length > 0
                    ? `<div class="error">${nameErrors[0]}</div>`
                    : ""
                }
              </div>
              
              <div class="form-group">
                <label for="email-input">Email</label>
                <input 
                  id="email-input" 
                  type="email" 
                  value="${formValue.email}" 
                  placeholder="Enter your email"
                  tooltip="Enter a valid email address"
                  tooltip-position="bottom"
                >
                ${
                  emailErrors.length > 0
                    ? `<div class="error">${emailErrors[0]}</div>`
                    : ""
                }
              </div>
              
              <div class="form-actions">
                <button type="submit" class="submit-btn">Submit</button>
                <button type="button" id="reset-form" class="reset-btn">Reset</button>
              </div>
            </form>
          </div>
          
          <div class="card-section">
            <h2>Custom Directives</h2>
            <div 
              id="outside-test" 
              class="clickable-area"
              click-outside="handleClickOutside"
            >
              Click outside this element to trigger the directive
            </div>
            <div 
              class="clickable-area"
              lazy-load
              src-lazy="https://i1.sndcdn.com/artworks-000557467059-24r0qo-t1080x1080.jpg"
            >
              This content will lazy load
            </div>
          </div>
        </div>
      `);
    } catch (error: any) {
      console.error("Error in render:", error);
      return (this.root.innerHTML = `<div class="error">Error rendering component: ${error.message}</div>`);
    }
  }
}
