export interface Action {
  type: string;
  payload?: any;
}

export type Reducer<T> = (state: T, action: Action) => T;

export type Selector<T, R> = (state: T) => R;

export interface Observer<T> {
  next: (state: T) => void;
  error?: (error: any) => void;
  complete?: () => void;
}

export interface Subscription {
  unsubscribe: () => void;
}

export class Store<T> {
  private state: T;
  private reducer: Reducer<T>;
  private observers: Observer<T>[] = [];

  constructor(initialState: T, reducer: Reducer<T>) {
    this.state = initialState;
    this.reducer = reducer;
  }

  getState(): T {
    return { ...this.state } as T;
  }

  dispatch(action: Action): void {
    this.state = this.reducer(this.state, action);
    this.notifyObservers();
  }

  subscribe(observerOrNext: Observer<T> | ((state: T) => void)): Subscription {
    const observer: Observer<T> =
      typeof observerOrNext === "function"
        ? { next: observerOrNext }
        : observerOrNext;

    this.observers.push(observer);

    return {
      unsubscribe: () => {
        this.observers = this.observers.filter((obs) => obs !== observer);
      },
    };
  }

  select<R>(selector: Selector<T, R>): R {
    return selector(this.getState());
  }

  private notifyObservers(): void {
    const state = this.getState();
    for (const observer of this.observers) {
      try {
        observer.next(state);
      } catch (error) {
        if (observer.error) {
          observer.error(error);
        } else {
          console.error("Error in observer:", error);
        }
      }
    }
  }
}
