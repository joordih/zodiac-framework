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
              display: block;
              padding: 1.5rem;
              background: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 500px;
              margin: 0 auto;
            }
            h1 {
              color: #2c3e50;
              font-size: 1.8rem;
              margin-bottom: 1rem;
              text-align: center;
            }
            .button-group {
              display: flex;
              gap: 0.8rem;
              justify-content: center;
              margin-bottom: 2rem;
            }
            button {
              padding: 0.6rem 1.2rem;
              cursor: pointer;
              border: none;
              border-radius: 6px;
              font-weight: 600;
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
            .form-group {
              margin-bottom: 1.2rem;
            }
            label {
              display: block;
              margin-bottom: 0.5rem;
              font-weight: 500;
              color: #34495e;
            }
            input {
              width: 100%;
              padding: 0.8rem;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-size: 1rem;
            }
            input:focus {
              outline: none;
              border-color: #3498db;
              box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
            }
            .error {
              color: #e74c3c;
              font-size: 0.85rem;
              margin-top: 0.4rem;
            }
            .form-actions {
              display: flex;
              justify-content: space-between;
              margin-top: 1.5rem;
            }
            .submit-btn {
              background: #2ecc71;
              color: white;
            }
            .submit-btn:hover {
              background: #27ae60;
            }
            .reset-btn {
              background: #95a5a6;
              color: white;
            }
            .reset-btn:hover {
              background: #7f8c8d;
            }
            .card-section {
              padding: 1rem;
              margin-bottom: 1rem;
              border: 1px solid #eee;
              border-radius: 8px;
            }
            .card-section h2 {
              font-size: 1.2rem;
              margin-bottom: 0.8rem;
              color: #2c3e50;
            }
            .clickable-area {
              padding: 1rem;
              background: #f8f9fa;
              border-radius: 6px;
              text-align: center;
              cursor: pointer;
              margin-top: 1rem;
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
              src-lazy="https://example.com/image.jpg"
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
