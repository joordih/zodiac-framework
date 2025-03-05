interface InjectionInfo {
  propertyKey: string | symbol;
  token: string;
}

interface InjectionConstructor {
  new (...args: any[]): any;
  __injections__?: InjectionInfo[];
}
