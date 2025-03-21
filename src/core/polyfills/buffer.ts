/* @ts-ignore */
const globalObj = typeof global !== 'undefined' ? global : 
                  typeof window !== 'undefined' ? window : 
                  typeof globalThis !== 'undefined' ? globalThis : {};


const NodeBuffer = typeof global !== 'undefined' && global.Buffer;
const NodeBlob = typeof global !== 'undefined' && global.Blob;


const BrowserBlob = typeof window !== 'undefined' ? window.Blob : null;

export const Blob = NodeBlob || BrowserBlob || class {
  constructor(parts: any[], _options?: any) {
    return parts;
  }
};

class BufferPolyfill extends Uint8Array {
  static from(arrayLike: ArrayLike<number> | Iterable<number> | string | ArrayBuffer, _mapfn?: (v: number, k: number) => number, _thisArg?: any): BufferPolyfill {
    if (typeof arrayLike === 'string') {
      const encoder = new TextEncoder();
      return new BufferPolyfill(encoder.encode(arrayLike));
    }
    if (arrayLike instanceof ArrayBuffer) {
      return new BufferPolyfill(arrayLike);
    }
    return new BufferPolyfill(Array.from(arrayLike));
  }

  static alloc(size: number): BufferPolyfill {
    return new BufferPolyfill(size);
  }

  static allocUnsafe(size: number): BufferPolyfill {
    return new BufferPolyfill(size);
  }

  static isBuffer(obj: any): boolean {
    return obj instanceof BufferPolyfill || (NodeBuffer && NodeBuffer.isBuffer(obj));
  }

  toString(encoding?: string): string {
    const decoder = new TextDecoder(encoding);
    return decoder.decode(this);
  }
}


export const Buffer = NodeBuffer || BufferPolyfill;


if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}

export default {
  Blob,
  Buffer
}; 