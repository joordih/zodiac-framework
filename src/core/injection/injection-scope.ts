/**
 * Enum defining the scope of injected services
 */
export enum InjectionScope {
  /**
   * One instance for the entire application
   */
  SINGLETON,
  
  /**
   * New instance each time the service is requested
   */
  TRANSIENT,
  
  /**
   * One instance per request (useful for web applications)
   */
  REQUEST
}
