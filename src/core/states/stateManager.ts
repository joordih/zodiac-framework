import { Observer, Subject } from "./observer.ts";

export class StateManager implements Subject {
  private static instance: StateManager;
  private state: Record<string, any> = {};
  private observers: Observer[] = [];

  private constructor() {}

  static getInstance(): StateManager {
    console.log("StateManager.getInstance() called");
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  get<T>(key: string): T {
    return this.state[key] as T;
  }

  set<T>(key: string, value: T): void {
    const oldValue = this.state[key];
    this.state[key] = value;

    if (oldValue !== value) {
      this.notify({
        key,
        oldValue,
        newValue: value,
      });
    }
  }

  attach(observer: Observer): void {
    const isExist = this.observers.includes(observer);
    if (!isExist) {
      this.observers.push(observer);
    }
  }

  detach(observer: Observer): void {
    const observerIndex = this.observers.indexOf(observer);
    if (observerIndex !== -1) {
      this.observers.splice(observerIndex, 1);
    }
  }

  notify(data: any): void {
    for (const observer of this.observers) {
      observer.update(data);
    }
  }
}
