const globalObj = typeof global !== 'undefined' ? global : 
                  typeof window !== 'undefined' ? window : 
                  typeof globalThis !== 'undefined' ? globalThis : {};

if (typeof global === 'undefined') {
  (globalObj as any).global = globalObj;
}

if (typeof globalThis === 'undefined') {
  (globalObj as any).globalThis = globalObj;
}


if (typeof setImmediate === 'undefined') {
  (globalObj as any).setImmediate = (callback: Function) => setTimeout(callback, 0);
}

export default globalObj; 