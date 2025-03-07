import {
  DirectiveConstructor,
  DirectiveLifecycle,
} from "./directive.interface.ts";
import { DIRECTIVES_REGISTRY } from "./directive.decorator.ts";
import { IService } from "../services/service.ts";
import { ServiceData } from "../services/decorator.ts";
import { InjectionScope } from "../injection/injection-scope.ts";

interface DirectiveInstance {
  directive: DirectiveLifecycle;
  constructor: DirectiveConstructor;
  element: HTMLElement;
}

@ServiceData({
  token: "directive-manager",
  scope: InjectionScope.SINGLETON,
})
export class DirectiveManager implements IService {
  [x: string]: any;
  private directiveInstances: Map<HTMLElement, DirectiveInstance[]> = new Map();
  private mutationObserver!: MutationObserver;

  async onInit(): Promise<void> {
    this.mutationObserver = new MutationObserver(
      this.handleMutations.bind(this)
    );

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
    });

    this.processExistingElements();
  }

  async onDestroy(): Promise<void> {
    this.mutationObserver.disconnect();

    for (const [element, instances] of this.directiveInstances.entries()) {
      for (const instance of instances) {
        this.destroyDirective(instance);
      }
    }

    this.directiveInstances.clear();
  }

  register(): void | Promise<void> {
    return;
  }

  unregister(): void | Promise<void> {
    return;
  }

  private processExistingElements(): void {
    const elements = document.querySelectorAll("*");

    for (const element of elements) {
      this.processElement(element as HTMLElement);
    }
  }

  private handleMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.processElement(node as HTMLElement);

            const childElements = (node as HTMLElement).querySelectorAll("*");
            for (const childElement of childElements) {
              this.processElement(childElement as HTMLElement);
            }
          }
        }

        for (const node of mutation.removedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.handleElementRemoved(node as HTMLElement);

            const childElements = (node as HTMLElement).querySelectorAll("*");
            for (const childElement of childElements) {
              this.handleElementRemoved(childElement as HTMLElement);
            }
          }
        }
      }

      if (
        mutation.type === "attributes" &&
        mutation.target.nodeType === Node.ELEMENT_NODE
      ) {
        this.handleAttributeChanged(
          mutation.target as HTMLElement,
          mutation.attributeName!,
          mutation.oldValue,
          (mutation.target as HTMLElement).getAttribute(mutation.attributeName!)
        );
      }
    }
  }

  private processElement(element: HTMLElement): void {
    for (const DirectiveClass of DIRECTIVES_REGISTRY) {
      const { selector } = DirectiveClass.definition;

      if (this.elementMatchesSelector(element, selector)) {
        const instances = this.directiveInstances.get(element) || [];

        if (
          !instances.some((instance) => instance.constructor === DirectiveClass)
        ) {
          const directive = new DirectiveClass(element);

          instances.push({
            directive,
            constructor: DirectiveClass,
            element,
          });

          this.directiveInstances.set(element, instances);

          this.initDirective({
            directive,
            constructor: DirectiveClass,
            element,
          });
        }
      }
    }
  }

  private handleElementRemoved(element: HTMLElement): void {
    const instances = this.directiveInstances.get(element);

    if (instances) {
      for (const instance of instances) {
        if (instance.directive.onDisconnected) {
          instance.directive.onDisconnected();
        }
      }
    }
  }

  private handleAttributeChanged(
    element: HTMLElement,
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    const instances = this.directiveInstances.get(element);

    if (instances) {
      for (const instance of instances) {
        const { observedAttributes } = instance.constructor.definition;

        if (observedAttributes && observedAttributes.includes(name)) {
          if (instance.directive.onAttributeChanged) {
            instance.directive.onAttributeChanged(name, oldValue, newValue);
          }
        }
      }
    }
  }

  private async initDirective(instance: DirectiveInstance): Promise<void> {
    if (instance.directive.onInit) {
      await instance.directive.onInit();
    }

    if (instance.element.isConnected && instance.directive.onConnected) {
      await instance.directive.onConnected();
    }
  }

  private async destroyDirective(instance: DirectiveInstance): Promise<void> {
    if (instance.directive.onDestroy) {
      await instance.directive.onDestroy();
    }
  }

  private elementMatchesSelector(
    element: HTMLElement,
    selector: string
  ): boolean {
    if (selector.startsWith("[") && selector.endsWith("]")) {
      const attributeName = selector.slice(1, -1);
      return element.hasAttribute(attributeName);
    }

    if (selector.startsWith(".")) {
      const className = selector.slice(1);
      return element.classList.contains(className);
    }

    return element.tagName.toLowerCase() === selector.toLowerCase();
  }
}
