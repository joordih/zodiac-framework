interface GlobalWithTextCoders {
  TextDecoder?: any;
  TextEncoder?: any;
  [key: string]: any;
}

const globalObj = (typeof global !== 'undefined' ? global : 
                  typeof window !== 'undefined' ? window : 
                  typeof globalThis !== 'undefined' ? globalThis : {}) as GlobalWithTextCoders;


const NodeUtil = typeof require !== 'undefined' ? require('util') : null;

export const TextDecoder = globalObj.TextDecoder || (NodeUtil && NodeUtil.TextDecoder) || 
                          (typeof require !== 'undefined' ? require('util').TextDecoder : null);
export const TextEncoder = globalObj.TextEncoder || (NodeUtil && NodeUtil.TextEncoder) || 
                          (typeof require !== 'undefined' ? require('util').TextEncoder : null);

export function format(formatStr: string, ...args: any[]): string {
  if (NodeUtil && NodeUtil.format) {
    return NodeUtil.format(formatStr, ...args);
  }

  return formatStr.replace(/%[sdj%]/g, function(match: string): string {
    if (match === '%%') return '%';
    if (args.length === 0) return match;
    switch (match) {
      case '%s': return String(args.shift());
      case '%d': return String(Number(args.shift()));
      case '%j': return JSON.stringify(args.shift());
      default: return match;
    }
  });
}

export function inspect(obj: any): string {
  if (NodeUtil && NodeUtil.inspect) {
    return NodeUtil.inspect(obj);
  }
  return typeof obj === 'object' ? JSON.stringify(obj, null, 2) : String(obj);
}

export function promisify(fn: Function): (...args: any[]) => Promise<any> {
  if (NodeUtil && NodeUtil.promisify) {
    return NodeUtil.promisify(fn);
  }
  
  return (...args: any[]) => {
    return new Promise((resolve, reject) => {
      fn(...args, (err: Error, result: any) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
}

export function inherits(ctor: any, superCtor: any): void {
  if (NodeUtil && NodeUtil.inherits) {
    return NodeUtil.inherits(ctor, superCtor);
  }
  
  if (ctor === undefined || ctor === null) {
    throw new TypeError('The constructor to "inherits" must not be null or undefined');
  }
  if (superCtor === undefined || superCtor === null) {
    throw new TypeError('The super constructor to "inherits" must not be null or undefined');
  }
  if (superCtor.prototype === undefined) {
    throw new TypeError('The super constructor to "inherits" must have a prototype');
  }
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
}

export default {
  TextDecoder,
  TextEncoder,
  format,
  inspect,
  promisify,
  inherits
}; 