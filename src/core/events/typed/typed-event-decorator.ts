import { TypedEventEmitter } from "./typed-event-emitter.ts";

export function TypedEvents<T extends Record<string, any>>() {
  return function (target: any) {
    const originalConnectedCallback = target.prototype.connectedCallback;

    target.prototype.connectedCallback = async function (...args: any[]) {
      this._eventEmitter = new TypedEventEmitter<T>();

      this.on = function <K extends keyof T>(
        event: K,
        listener: (data: T[K]) => void
      ) {
        return this._eventEmitter.on(event, listener);
      };

      this.once = function <K extends keyof T>(
        event: K,
        listener: (data: T[K]) => void
      ) {
        return this._eventEmitter.once(event, listener);
      };

      this.off = function <K extends keyof T>(
        event: K,
        listener: (data: T[K]) => void
      ) {
        this._eventEmitter.off(event, listener);
      };

      this.emit = function <K extends keyof T>(event: K, data: T[K]) {
        this._eventEmitter.emit(event, data);
      };

      if (originalConnectedCallback) {
        await originalConnectedCallback.apply(this, args);
      }
    };

    const originalDisconnectedCallback = target.prototype.disconnectedCallback;

    target.prototype.disconnectedCallback = async function (...args: any[]) {
      if (this._eventEmitter) {
        this._eventEmitter.removeAllListeners();
        delete this._eventEmitter;
      }

      if (originalDisconnectedCallback) {
        await originalDisconnectedCallback.apply(this, args);
      }
    };
  };
}
