export interface Request {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export interface Response {
  status: number;
  headers: Record<string, string>;
  body?: any;
}

export type NextFunction = () => Promise<Response>;

export interface Middleware {
  handle(request: Request, next: NextFunction): Promise<Response>;
}
