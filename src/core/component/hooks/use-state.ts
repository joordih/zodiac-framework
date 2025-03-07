const statesMap = new WeakMap<any, Map<number, any>>();
const indexMap = new WeakMap<any, number>();

export function useState<T>(component: any, initialState: T): [T, (newState: T) => void] {
  if (!component) {
    throw new Error('Component is required for useState');
  }
  
  if (!statesMap.has(component)) {
    statesMap.set(component, new Map());
    indexMap.set(component, 0);
    
    const originalDisconnectedCallback = component.disconnectedCallback;
    component.disconnectedCallback = async function(...args: any[]) {
      statesMap.delete(component);
      indexMap.delete(component);
      
      if (originalDisconnectedCallback) {
        return originalDisconnectedCallback.apply(this, args);
      }
    };
  }
  
  const currentIndex = indexMap.get(component)!;
  const states = statesMap.get(component)!;
  
  if (!states.has(currentIndex)) {
    states.set(currentIndex, initialState);
  }
  
  const state = states.get(currentIndex);
  
  const setState = (newState: T) => {
    const states = statesMap.get(component);
    if (!states) return;
    
    const currentState = states.get(currentIndex);
    
    if (currentState !== newState) {
      states.set(currentIndex, newState);
      
      if (component.requestUpdate) {
        component.requestUpdate();
      }
    }
  };
  
  indexMap.set(component, currentIndex + 1);
  
  return [state, setState];
}
