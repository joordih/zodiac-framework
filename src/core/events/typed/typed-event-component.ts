import { Listener, Subscription } from "./typed-event-emitter.ts";

export interface TypedEventComponent<T extends Record<string, any>> {
  on<K extends keyof T>(event: K, listener: Listener<T[K]>): Subscription;
  once<K extends keyof T>(event: K, listener: Listener<T[K]>): Subscription;
  off<K extends keyof T>(event: K, listener: Listener<T[K]>): void;
  emit<K extends keyof T>(event: K, data: T[K]): void;
}
