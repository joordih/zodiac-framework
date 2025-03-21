export class Script {
  private code: string;

  constructor(code: string) {
    this.code = code;
  }

  runInContext(context: any): any {
    try {
      const fn = new Function(...Object.keys(context), this.code);
      return fn.apply(null, Object.values(context));
    } catch (error: any) {
      throw new Error(`Failed to execute script: ${error.message}`);
    }
  }

  runInNewContext(context: any = {}): any {
    return this.runInContext(context);
  }

  runInThisContext(): any {
    return this.runInContext({});
  }
}

export function createContext(initialContext: any = {}): any {
  return initialContext;
}

export function isContext(context: any): boolean {
  return context && typeof context === 'object';
}

export default {
  Script,
  createContext,
  isContext
}; 