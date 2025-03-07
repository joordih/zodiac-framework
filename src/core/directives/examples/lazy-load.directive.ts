import { Directive } from "../directive.decorator.ts";
import { DirectiveLifecycle } from "../directive.interface.ts";

@Directive({
  selector: '[lazy-load]',
  observedAttributes: ['src-lazy']
})
export class LazyLoadDirective implements DirectiveLifecycle {
  private element: HTMLElement;
  private intersectionObserver: IntersectionObserver | null = null;
  private lazySource: string = '';
  
  constructor(element: HTMLElement) {
    this.element = element;
  }
  
  onInit(): void {
    this.lazySource = this.element.getAttribute('src-lazy') || '';
    
    this.intersectionObserver = new IntersectionObserver(this.handleIntersection.bind(this), {
      rootMargin: '50px',
      threshold: 0.01
    });
    
    this.intersectionObserver.observe(this.element);
  }
  
  onDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
  }
  
  onAttributeChanged(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === 'src-lazy') {
      this.lazySource = newValue || '';
    }
  }
  
  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      if (entry.isIntersecting && this.lazySource) {
        this.loadSource();
        
        if (this.intersectionObserver) {
          this.intersectionObserver.disconnect();
          this.intersectionObserver = null;
        }
      }
    }
  }
  
  private loadSource(): void {
    if (!this.lazySource) {
      return;
    }
    
    if (this.element instanceof HTMLImageElement) {
      this.element.src = this.lazySource;
    } else if (this.element instanceof HTMLIFrameElement) {
      this.element.src = this.lazySource;
    } else {
      this.element.style.backgroundImage = `url(${this.lazySource})`;
    }
    
    this.element.removeAttribute('src-lazy');
    
    const loadEvent = new CustomEvent('lazy-loaded', {
      bubbles: true,
      detail: { source: this.lazySource }
    });
    
    this.element.dispatchEvent(loadEvent);
  }
}
