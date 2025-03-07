const memoMap = new WeakMap<any, Map<number, MemoInfo<any>>>();
const indexMap = new WeakMap<any, number>();

interface MemoInfo<T> {
  value: T;
  deps?: any[];
}

export function useMemo<T>(
  component: any,
  factory: () => T,
  deps?: any[]
): T {
  if (!component) {
    throw new Error('Component is required for useMemo');
  }
  
  if (!memoMap.has(component)) {
    memoMap.set(component, new Map());
    indexMap.set(component, 0);
    
    const originalDisconnectedCallback = component.disconnectedCallback;
    component.disconnectedCallback = async function(...args: any[]) {
      memoMap.delete(component);
      indexMap.delete(component);
      
      if (originalDisconnectedCallback) {
        return originalDisconnectedCallback.apply(this, args);
      }
    };
  }
  
  const currentIndex = indexMap.get(component)!;
  const memos = memoMap.get(component)!;
  
  const prevMemoInfo = memos.get(currentIndex);
  
  const hasNoDeps = !deps;
  const depsChanged = prevMemoInfo && deps 
    ? !deps.every((dep, i) => Object.is(dep, prevMemoInfo.deps?.[i]))
    : true;
  
  if (!prevMemoInfo || hasNoDeps || depsChanged) {
    const value = factory();
    memos.set(currentIndex, { value, deps });
    
    indexMap.set(component, currentIndex + 1);
    
    return value;
  }
  
  indexMap.set(component, currentIndex + 1);
  
  return prevMemoInfo.value;
}
