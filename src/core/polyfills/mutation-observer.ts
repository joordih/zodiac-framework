const isBrowser = typeof window !== 'undefined';

class MutationObserverPolyfill {
  private callback: MutationCallback;
  // @ts-ignore
  private target!: Node;
  // @ts-ignore
  private config!: MutationObserverInit;
  private observer!: any;

  constructor(callback: MutationCallback) {
    this.callback = callback;
  }

  observe(target: Node, config: MutationObserverInit): void {
    this.target = target;
    this.config = config;

    if (isBrowser) {
      this.observer = new window.MutationObserver(this.callback);
      this.observer.observe(target, config);
    }
  }

  disconnect(): void {
    if (isBrowser && this.observer) {
      this.observer.disconnect();
    }
  }

  takeRecords(): MutationRecord[] {
    if (isBrowser && this.observer) {
      return this.observer.takeRecords();
    }
    return [];
  }
}

export const MutationObserver = isBrowser ? window.MutationObserver : MutationObserverPolyfill;

if (!isBrowser) {
  (global as any).MutationObserver = MutationObserver;
} 