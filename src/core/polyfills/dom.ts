const globalObj = typeof global !== 'undefined' ? global : 
                  typeof window !== 'undefined' ? window : 
                  typeof globalThis !== 'undefined' ? globalThis : {};


const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';


const NativeElement = isBrowser ? window.Element : null;
const NativeHTMLElement = isBrowser ? window.HTMLElement : null;
const NativeDocument = isBrowser ? window.Document : null;
const NativeEvent = isBrowser ? window.Event : null;
const NativeCustomEvent = isBrowser ? window.CustomEvent : null;


let ElementPolyfill: any;
let HTMLElementPolyfill: any;
let DocumentPolyfill: any;
let EventPolyfill: any;
let CustomEventPolyfill: any;


if (!isBrowser) {
  class EventTargetPolyfill {
    private eventListeners: Map<string, Function[]> = new Map();

    addEventListener(type: string, listener: Function): void {
      if (!this.eventListeners.has(type)) {
        this.eventListeners.set(type, []);
      }
      this.eventListeners.get(type)!.push(listener);
    }

    removeEventListener(type: string, listener: Function): void {
      if (!this.eventListeners.has(type)) return;
      
      const listeners = this.eventListeners.get(type)!;
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
      
      if (listeners.length === 0) {
        this.eventListeners.delete(type);
      }
    }

    dispatchEvent(event: any): boolean {
      if (!event.type || !this.eventListeners.has(event.type)) {
        return true;
      }
      
      event.target = this;
      event.currentTarget = this;
      
      const listeners = this.eventListeners.get(event.type)!;
      for (const listener of listeners) {
        listener.call(this, event);
      }
      
      return !event.defaultPrevented;
    }
  }
  
  class ElementBasePolyfill extends EventTargetPolyfill {
    setAttribute(_name: string, _value: string): void {}
    getAttribute(_name: string): string | null { return null; }
    removeAttribute(_name: string): void {}
    hasAttribute(_name: string): boolean { return false; }
    getBoundingClientRect(): any { return { top: 0, left: 0, width: 0, height: 0 }; }
    appendChild(child: any): any { return child; }
    removeChild(_child: any): void {}
    replaceChild(newChild: any, _oldChild: any): any { return newChild; }
    insertBefore(newChild: any, _referenceNode: any): any { return newChild; }
    querySelector(_selector: string): any { return null; }
    querySelectorAll(_selector: string): any[] { return []; }
    getElementsByTagName(_tagName: string): any[] { return []; }
    getElementsByClassName(_className: string): any[] { return []; }
    getElementById(_id: string): any { return null; }
    contains(_other: any): boolean { return false; }
    matches(_selector: string): boolean { return false; }
    closest(_selector: string): any { return null; }
  }

  
  class ElementClass extends ElementBasePolyfill {
    constructor() {
      super();
    }
  }
  
  ElementPolyfill = ElementClass;

  
  class HTMLElementBasePolyfill extends ElementPolyfill {
    
    style = {};
    dataset = {};
    classList = { add: () => {}, remove: () => {}, contains: () => false };
    attributes = [];
    _shadowRoot: any = null;
    
    get shadowRoot() { return this._shadowRoot; }
    get innerHTML() { return ''; }
    set innerHTML(_value: string) {}
    get outerHTML() { return ''; }
    set outerHTML(_value: string) {}
    
    attachShadow(options: { mode: 'open' | 'closed' }): any {
      this._shadowRoot = { mode: options.mode, innerHTML: '' };
      return this._shadowRoot;
    }
  }

  
  class HTMLElementClass extends HTMLElementBasePolyfill {
    tagName: string = '';
    
    constructor() {
      super();
      if (this.constructor === HTMLElementClass) {
        throw new TypeError("Illegal constructor");
      }
    }
  }
  
  HTMLElementPolyfill = HTMLElementClass;

  class DocumentFragmentPolyfill extends ElementPolyfill {
    constructor() {
      super();
    }
  }

  // @ts-ignore
  class ShadowRootPolyfill extends DocumentFragmentPolyfill {
    constructor() {
      super();
    }
    
    mode = 'open';
    host = null;
  }

  class DocumentClass extends ElementPolyfill {
    documentElement = new ElementPolyfill();
    head = new ElementPolyfill();
    body = new ElementPolyfill();
    
    createElement(tagName: string): any {
      const element = new HTMLElementPolyfill();
      element.tagName = tagName.toUpperCase();
      return element;
    }
    
    createDocumentFragment(): any {
      return new DocumentFragmentPolyfill();
    }
  }
  
  DocumentPolyfill = DocumentClass;

  class EventClass {
    readonly bubbles: boolean;
    readonly cancelable: boolean;
    readonly composed: boolean;
    readonly currentTarget: any = null;
    readonly defaultPrevented: boolean = false;
    readonly eventPhase: number = 0;
    readonly isTrusted: boolean = true;
    returnValue: boolean = true;
    readonly target: any = null;
    readonly timeStamp: number = Date.now();
    readonly type: string;
    
    constructor(type: string, eventInitDict?: any) {
      this.type = type;
      this.bubbles = eventInitDict?.bubbles || false;
      this.cancelable = eventInitDict?.cancelable || false;
      this.composed = eventInitDict?.composed || false;
    }
    
    composedPath(): any[] {
      return [];
    }
    
    preventDefault(): void {
      if (this.cancelable) {
        Object.defineProperty(this, 'defaultPrevented', { value: true });
      }
    }
    
    stopImmediatePropagation(): void {}
    stopPropagation(): void {}
  }
  
  EventPolyfill = EventClass;

  class CustomEventClass<T = any> extends EventPolyfill {
    readonly detail: T;
    
    constructor(type: string, eventInitDict?: any) {
      super(type, eventInitDict);
      this.detail = eventInitDict?.detail as T;
    }
  }
  
  CustomEventPolyfill = CustomEventClass;

  
  class CustomElementRegistry {
    private registry = new Map<string, any>();

    define(name: string, constructor: any): void {
      this.registry.set(name, constructor);
    }

    get(name: string): any {
      return this.registry.get(name);
    }

    whenDefined(_name: string): Promise<void> {
      return Promise.resolve();
    }
  }

  
  (globalObj as any).Element = ElementPolyfill;
  (globalObj as any).HTMLElement = HTMLElementPolyfill;
  (globalObj as any).Document = DocumentPolyfill;
  (globalObj as any).document = new DocumentPolyfill();
  (globalObj as any).Event = EventPolyfill;
  (globalObj as any).CustomEvent = CustomEventPolyfill;
  (globalObj as any).customElements = new CustomElementRegistry();
}


export const Element = isBrowser ? NativeElement : (globalObj as any).Element;
export const HTMLElement = isBrowser ? NativeHTMLElement : (globalObj as any).HTMLElement;
export const Document = isBrowser ? NativeDocument : (globalObj as any).Document;
export const Event = isBrowser ? NativeEvent : (globalObj as any).Event;
export const CustomEvent = isBrowser ? NativeCustomEvent : (globalObj as any).CustomEvent; 