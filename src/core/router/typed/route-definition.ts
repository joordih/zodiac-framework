export interface RouteParams {
  [key: string]: string | number;
}

export interface RouteQueryParams {
  [key: string]: string | number | boolean | string[] | number[] | boolean[] | undefined;
}

export interface TypedRoute<
  Params extends RouteParams = {},
  QueryParams extends RouteQueryParams = {}
> {
  path: string;
  component: string;
  title?: string;
  meta?: Record<string, any>;
  canActivate?: (params: Params, queryParams: QueryParams) => boolean | string | Promise<boolean | string>;
  children?: Array<TypedRoute<any, any>>;
}
