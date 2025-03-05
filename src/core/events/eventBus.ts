export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  private constructor() {}

  static getInstance(): EventBus {
    console.log("EventBus instance created.");
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on<T>(eventName: string, callback: (data: T) => void): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    this.listeners.get(eventName)!.add(callback);

    return () => {
      const callbacks = this.listeners.get(eventName);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(eventName);
        }
      }
    };
  }

  emit<T>(eventName: string, data?: T): void {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName)!.forEach((callback) => {
        callback(data);
      });
    }
  }

  once<T>(eventName: string, callback: (data: T) => void): void {
    const unsubscribe = this.on(eventName, (data: T) => {
      callback(data);
      unsubscribe();
    });
  }

  off(eventName: string): void {
    this.listeners.delete(eventName);
  }
}
