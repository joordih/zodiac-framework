import { Directive } from "../directive.decorator.ts";
import { DirectiveLifecycle } from "../directive.interface.ts";

@Directive({
  selector: '[click-outside]',
  observedAttributes: ['click-outside']
})
export class ClickOutsideDirective implements DirectiveLifecycle {
  private element: HTMLElement;
  private callbackName: string = '';
  private clickHandler: (event: MouseEvent) => void;
  
  constructor(element: HTMLElement) {
    this.element = element;
    this.clickHandler = this.handleClick.bind(this);
  }
  
  onInit(): void {
    this.callbackName = this.element.getAttribute('click-outside') || '';
    
    document.addEventListener('click', this.clickHandler);
  }
  
  onDestroy(): void {
    document.removeEventListener('click', this.clickHandler);
  }
  
  onAttributeChanged(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === 'click-outside') {
      this.callbackName = newValue || '';
    }
  }
  
  private handleClick(event: MouseEvent): void {
    if (!this.callbackName) {
      return;
    }
    
    const target = event.target as Node;
    if (target && !this.element.contains(target)) {
      let component: any = this.element;
      
      if (!(this.callbackName in component)) {
        let parent = this.element.parentElement;
        while (parent) {
          if (parent && this.callbackName in parent && typeof (parent as any)[this.callbackName] === 'function') {
            component = parent;
            break;
          }
          parent = parent.parentElement;
        }
      }
      
      if (component && this.callbackName in component && typeof component[this.callbackName] === 'function') {
        component[this.callbackName](event);
      }
    }
  }
}
