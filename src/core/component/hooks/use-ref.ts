export interface Ref<T> {
  current: T;
}

const refsMap = new WeakMap<any, Map<number, Ref<any>>>();
const indexMap = new WeakMap<any, number>();

export function useRef<T>(component: any, initialValue: T): Ref<T> {
  if (!component) {
    throw new Error('Component is required for useRef');
  }
  
  if (!refsMap.has(component)) {
    refsMap.set(component, new Map());
    indexMap.set(component, 0);
    
    const originalDisconnectedCallback = component.disconnectedCallback;
    component.disconnectedCallback = async function(...args: any[]) {
      refsMap.delete(component);
      indexMap.delete(component);
      
      if (originalDisconnectedCallback) {
        return originalDisconnectedCallback.apply(this, args);
      }
    };
  }
  
  const currentIndex = indexMap.get(component)!;
  const refs = refsMap.get(component)!;
  
  if (!refs.has(currentIndex)) {
    refs.set(currentIndex, { current: initialValue });
  }
  
  const ref = refs.get(currentIndex)!;
  
  indexMap.set(component, currentIndex + 1);
  
  return ref;
}
