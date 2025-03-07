/**
 * Interface for defining Zodiac modules
 */
export interface IZodiacModule {
  imports?: Array<Type<any>>;
  declarations?: Array<Type<any>>;
  providers?: Array<Provider>;
  exports?: Array<Type<any>>;
}

/**
 * Type interface for class constructors
 */
export interface Type<T> extends Function {
  new (...args: any[]): T;
}

/**
 * Provider interface for dependency injection
 */
export interface Provider {
  provide: string;
  useClass?: Type<any>;
  useValue?: any;
  useFactory?: (...args: any[]) => any;
  deps?: Array<string>;
}
