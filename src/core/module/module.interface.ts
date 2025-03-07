export interface IZodiacModule {
  imports?: Array<Type<any>>;
  declarations?: Array<Type<any>>;
  providers?: Array<Provider>;
  exports?: Array<Type<any>>;
}
export interface Type<T> extends Function {
  new (...args: any[]): T;
}

export interface Provider {
  provide: string;
  useClass?: Type<any>;
  useValue?: any;
  useFactory?: (...args: any[]) => any;
  deps?: Array<string>;
}
