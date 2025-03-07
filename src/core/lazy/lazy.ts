export interface LazyOptions {
  path: string;
  loading?: string;
}

const lazyComponents = new Map<string, Promise<any>>();

export function Lazy(options: LazyOptions) {
  return function (target: any) {
    const originalComponent = target;

    return new Proxy(target, {
      construct(_target: any, args: any[], newTarget: Function): object {
        if (!lazyComponents.has(options.path)) {
          const loadingElement = options.loading
            ? document.createElement(options.loading)
            : document.createElement("div");

          // fuck dynamic imports in vite
          const loadPromise = import(/* @vite-ignore */ options.path)
            .then((_module) => {
              const component = Reflect.construct(
                originalComponent,
                args,
                newTarget
              );
              if (loadingElement.parentNode) {
                loadingElement.parentNode.replaceChild(
                  component,
                  loadingElement
                );
              }
              return component;
            })
            .catch((error) => {
              console.error(
                `Error loading component from ${options.path}:`,
                error
              );
              return Reflect.construct(originalComponent, args, newTarget);
            });

          lazyComponents.set(options.path, loadPromise);
          return loadingElement;
        }

        const tempElement = options.loading
          ? document.createElement(options.loading)
          : document.createElement("div");

        lazyComponents.get(options.path)!.then((component) => {
          if (tempElement.parentNode) {
            tempElement.parentNode.replaceChild(component, tempElement);
          }
        });

        return tempElement;
      },
    });
  };
}
