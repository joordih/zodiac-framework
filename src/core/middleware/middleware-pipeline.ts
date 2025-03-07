import { Middleware, Request, Response } from "./middleware.interface.ts";

export class MiddlewarePipeline {
  private middlewares: Middleware[] = [];
  
  use(middleware: Middleware): this {
    this.middlewares.push(middleware);
    return this;
  }
  
  async process(request: Request, handler: () => Promise<Response>): Promise<Response> {
    const pipeline = this.middlewares.reduceRight(
      (next, middleware) => {
        return async () => middleware.handle(request, next);
      },
      handler
    );
    
    return pipeline();
  }
}
