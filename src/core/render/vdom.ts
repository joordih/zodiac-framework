export interface VNode {
  type: string;
  props: Record<string, any>;
  children: (VNode | string)[];
}

declare global {
  interface Element {
    _vdom?: VNode;
  }
}

export class VirtualDOM {
  private static isServer = typeof window === 'undefined';

  static createFromElement(element: HTMLElement): VNode {
    return {
      type: element.tagName,
      props: this.getElementProps(element),
      children: Array.from(element.childNodes).map((node) =>
        node.nodeType === Node.TEXT_NODE
          ? node.textContent || ""
          : this.createFromElement(node as HTMLElement)
      ),
    };
  }

  private static getElementProps(element: HTMLElement): Record<string, any> {
    const props: Record<string, any> = {};
    Array.from(element.attributes).forEach((attr) => {
      props[attr.name] = attr.value;
    });
    return props;
  }

  static diff(oldNode: VNode | null, newNode: VNode): Array<() => void> {
    if (this.isServer) {
      // No-op for server-side rendering
      return [];
    }

    const patches: Array<() => void> = [];

    if (!oldNode) {
      patches.push(() => {
        const element = document.createElement(newNode.type);
        this.applyProps(element, newNode.props);
        this.applyChildren(element, newNode.children);
      });
    } else if (oldNode.type !== newNode.type) {
      patches.push(() => {
        const oldElement = document.querySelector(
          `[data-component="${oldNode.type}"]`
        );
        if (oldElement) {
          const newElement = document.createElement(newNode.type);
          this.applyProps(newElement, newNode.props);
          this.applyChildren(newElement, newNode.children);
          oldElement.parentNode?.replaceChild(newElement, oldElement);
          newElement._vdom = newNode;
        }
      });
    } else {
      const propPatches = this.diffProps(oldNode.props, newNode.props);
      patches.push(
        ...propPatches.map((patch) => () => {
          const element = document.querySelector(
            `[data-component="${newNode.type}"]`
          );
          if (element) {
            patch(element);
            element._vdom = newNode;
          }
        })
      );

      const childPatches = this.diffChildren(
        oldNode.children,
        newNode.children
      );
      patches.push(
        ...childPatches.map((patch) => () => {
          const element = document.querySelector(
            `[data-component="${newNode.type}"]`
          );
          if (element) {
            patch(element);
            element._vdom = newNode;
          }
        })
      );
    }

    return patches;
  }

  private static diffProps(
    oldProps: Record<string, any>,
    newProps: Record<string, any>
  ): Array<(element: Element) => void> {
    const patches: Array<(element: Element) => void> = [];

    Object.keys(oldProps).forEach((key) => {
      if (!(key in newProps)) {
        patches.push((element) => element.removeAttribute(key));
      }
    });

    Object.entries(newProps).forEach(([key, value]) => {
      if (oldProps[key] !== value) {
        patches.push((element) => element.setAttribute(key, value));
      }
    });

    return patches;
  }

  private static diffChildren(
    oldChildren: (VNode | string)[],
    newChildren: (VNode | string)[]
  ): Array<(element: Element) => void> {
    const patches: Array<(element: Element) => void> = [];
    const maxLength = Math.max(oldChildren.length, newChildren.length);

    for (let i = 0; i < maxLength; i++) {
      const oldChild = oldChildren[i];
      const newChild = newChildren[i];

      if (!oldChild) {
        patches.push((element) => {
          if (typeof newChild === "string") {
            element.appendChild(document.createTextNode(newChild));
          } else {
            const newElement = document.createElement(newChild.type);
            this.applyProps(newElement, newChild.props);
            this.applyChildren(newElement, newChild.children);
            element.appendChild(newElement);
            newElement._vdom = newChild;
          }
        });
      } else if (!newChild) {
        patches.push((element) => {
          if (element.childNodes[i]) {
            element.removeChild(element.childNodes[i]);
          }
        });
      } else if (typeof oldChild === "string" && typeof newChild === "string") {
        if (oldChild !== newChild) {
          patches.push((element) => {
            if (element.childNodes[i]) {
              element.childNodes[i].textContent = newChild;
            }
          });
        }
      } else if (typeof oldChild !== "string" && typeof newChild !== "string") {
        const childPatches = this.diff(oldChild, newChild);
        patches.push((_element) => {
          childPatches.forEach((patch) => patch());
        });
      }
    }

    return patches;
  }

  private static applyProps(
    element: Element,
    props: Record<string, any>
  ): void {
    Object.entries(props).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  private static applyChildren(
    element: Element,
    children: (VNode | string)[]
  ): void {
    children.forEach((child) => {
      if (typeof child === "string") {
        element.appendChild(document.createTextNode(child));
      } else {
        const childElement = document.createElement(child.type);
        this.applyProps(childElement, child.props);
        this.applyChildren(childElement, child.children);
        element.appendChild(childElement);
        childElement._vdom = child;
      }
    });
  }

  // New method for server-side rendering
  static renderToString(vnode: VNode): string {
    if (typeof vnode === 'string') {
      return vnode;
    }

    let attrs = '';
    for (const [key, value] of Object.entries(vnode.props)) {
      attrs += ` ${key}="${value}"`;
    }

    if (vnode.children.length === 0) {
      return `<${vnode.type}${attrs}></${vnode.type}>`;
    }

    const children = vnode.children.map(child => 
      typeof child === 'string' ? child : this.renderToString(child)
    ).join('');

    return `<${vnode.type}${attrs}>${children}</${vnode.type}>`;
  }

  // New method to create a VNode from a component name and props
  static createVNodeFromComponent(componentName: string, props: Record<string, any> = {}): VNode {
    return {
      type: componentName,
      props,
      children: []
    };
  }
}

export function Render() {
  return function (
    target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const result = originalMethod.apply(this, args);
      
      // Skip DOM operations on the server
      if (typeof window === 'undefined') {
        return result;
      }
      
      if (result instanceof Promise) {
        return result.then((template) => {
          const temporaryContainer = document.createElement("div");
          temporaryContainer.innerHTML = template;
          const vdom = VirtualDOM.createFromElement(
            temporaryContainer.firstElementChild as HTMLElement
          );
          const element = document.querySelector(
            `[data-component="${target.constructor.name}"]`
          );
          if (element) {
            const patches = VirtualDOM.diff(element._vdom as VNode, vdom);
            patches.forEach((patch) => patch());
            element._vdom = vdom;
          }
        });
      } else {
        const temporaryContainer = document.createElement("div");
        temporaryContainer.innerHTML = result;
        const vdom = VirtualDOM.createFromElement(
          temporaryContainer.firstElementChild as HTMLElement
        );
        const element = document.querySelector(
          `[data-component="${target.constructor.name}"]`
        );
        if (element) {
          const patches = VirtualDOM.diff(element._vdom as VNode, vdom);
          patches.forEach((patch) => patch());
          element._vdom = vdom;
        }
      }
    };
    return descriptor;
  };
}