/**
 * Interface for RouterOutlet to break circular dependency between
 * router-outlet.ts and router-service.ts
 */
export interface IRouterOutlet {
  /**
   * Renders a component in the outlet
   * @param component The component to render
   */
  renderComponent(component: HTMLElement): void;
}