export interface InjectionInfo {
  propertyKey: string | symbol;
  token: string;
}

export interface InjectionProperty {
  new (...args: any[]): any;
  __injections__?: InjectionInfo[];
}
