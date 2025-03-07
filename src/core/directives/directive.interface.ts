export interface DirectiveLifecycle {
  onInit?(): void | Promise<void>;
  onConnected?(): void | Promise<void>;
  onDisconnected?(): void | Promise<void>;
  onAttributeChanged?(name: string, oldValue: string | null, newValue: string | null): void | Promise<void>;
  onDestroy?(): void | Promise<void>;
}

export interface DirectiveDefinition {
  selector: string;
  observedAttributes?: string[];
}

export interface DirectiveConstructor {
  new (element: HTMLElement): DirectiveLifecycle;
  definition: DirectiveDefinition;
}
