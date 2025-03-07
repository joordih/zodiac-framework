export interface RouteContext {
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
  component: string;
  state?: Record<string, any>;
}

export interface ComponentContext {
  componentName: string;
  methodName: string;
  args: any[];
  state?: Record<string, any>;
}

export type RouteMiddlewareFunction = (
  context: RouteContext,
  next: () => Promise<void>
) => Promise<void>;

export type ComponentMiddlewareFunction = (
  context: ComponentContext,
  next: () => Promise<void>
) => Promise<void>;

export type MiddlewareFunction = (
  context: RouteContext | ComponentContext,
  next: () => Promise<void>
) => Promise<void>;

export function createComponentMiddleware(
  handler: (
    context: ComponentContext,
    next: () => Promise<void>
  ) => Promise<void>
) {
  return function (
    _target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context: ComponentContext = {
        componentName: (this.constructor as any).tagName,
        methodName: propertyKey,
        args,
        state: {},
      };

      await handler(context, async () => {
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}

export const LoggerMiddleware = createComponentMiddleware(
  async (context: ComponentContext, next: () => Promise<void>) => {
    const startTime = performance.now();
    console.log(` [${context.componentName}] ${context.methodName} started`);

    try {
      await next();
      const endTime = performance.now();
      console.log(
        ` [${context.componentName}] ${context.methodName} completed in ${(
          endTime - startTime
        ).toFixed(2)}ms`
      );
    } catch (error) {
      console.error(
        ` [${context.componentName}] ${context.methodName} failed:`,
        error
      );
      throw error;
    }
  }
);

export const ErrorBoundaryMiddleware = createComponentMiddleware(
  async (context: ComponentContext, next: () => Promise<void>) => {
    try {
      await next();
    } catch (error) {
      console.error(
        `Error in ${context.componentName}.${context.methodName}:`,
        error
      );
      const errorElement = document.createElement("div");
      errorElement.className = "error-boundary";
      errorElement.innerHTML = `
      <div class="error-content">
        <h2>Something went wrong</h2>
        <p>${
          error instanceof Error ? error.message : "An unknown error occurred"
        }</p>
        <button onclick="window.location.reload()">Retry</button>
      </div>
    `;

      const componentRoot = document.querySelector(
        context.componentName.toLowerCase()
      );
      if (componentRoot) {
        componentRoot.innerHTML = "";
        componentRoot.appendChild(errorElement);
      }
    }
  }
);

export function Middleware(
  middlewareFn: MiddlewareFunction | MiddlewareFunction[]
) {
  return function (
    target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const middlewares = Array.isArray(middlewareFn)
      ? middlewareFn
      : [middlewareFn];

    descriptor.value = async function (...args: any[]) {
      const context: RouteContext = {
        path: location.pathname,
        params: {},
        query: new URLSearchParams(location.search),
        component: target.constructor.tagName,
        state: {},
      };

      let currentIndex = 0;
      const executeMiddleware = async (): Promise<void> => {
        if (currentIndex < middlewares.length) {
          const middleware = middlewares[currentIndex++];
          await middleware(context, executeMiddleware);
        } else {
          await originalMethod.apply(this, args);
        }
      };

      await executeMiddleware();
    };
    return descriptor;
  };
}

export const AuthMiddleware = (
  options: { redirectTo?: string } = {}
): RouteMiddlewareFunction => {
  return async (context: RouteContext, next: () => Promise<void>) => {
    const isAuthenticated = localStorage.getItem("auth_token") !== null;

    if (!isAuthenticated && options.redirectTo) {
      window.location.href = options.redirectTo;
      return;
    }

    context.state = {
      ...context.state,
      isAuthenticated,
      authToken: localStorage.getItem("auth_token"),
    };

    await next();
  };
};
