export interface Listener<T> {
  (data: T): void;
}

export interface Subscription {
  unsubscribe: () => void;
}

export class TypedEventEmitter<T extends Record<string, any>> {
  private listeners: Partial<{
    [K in keyof T]: Array<Listener<T[K]>>
  }> = {};
  
  on<K extends keyof T>(event: K, listener: Listener<T[K]>): Subscription {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    this.listeners[event]!.push(listener);
    
    return {
      unsubscribe: () => {
        this.off(event, listener);
      }
    };
  }
  
  off<K extends keyof T>(event: K, listener: Listener<T[K]>): void {
    if (!this.listeners[event]) {
      return;
    }
    
    this.listeners[event] = this.listeners[event]!.filter(l => l !== listener);
  }
  
  emit<K extends keyof T>(event: K, data: T[K]): void {
    if (!this.listeners[event]) {
      return;
    }
    
    for (const listener of this.listeners[event]!) {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${String(event)}:`, error);
      }
    }
  }
  
  once<K extends keyof T>(event: K, listener: Listener<T[K]>): Subscription {
    const onceListener = (data: T[K]) => {
      this.off(event, onceListener);
      listener(data);
    };
    
    return this.on(event, onceListener);
  }
  
  removeAllListeners<K extends keyof T>(event?: K): void {
    if (event) {
      this.listeners[event] = [];
    } else {
      this.listeners = {};
    }
  }
  
  listenerCount<K extends keyof T>(event: K): number {
    return this.listeners[event]?.length || 0;
  }
}
