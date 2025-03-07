export type EffectCleanup = () => void;
export type EffectCallback = () => EffectCleanup | void;

export interface EffectOptions {
  deps?: any[];
}

const effectsMap = new WeakMap<any, Map<number, EffectInfo>>();

interface EffectInfo {
  cleanup?: EffectCleanup;
  deps?: any[];
}

export function useEffect(
  component: any,
  effect: EffectCallback,
  options: EffectOptions = {}
): void {
  if (!component) {
    throw new Error('Component is required for useEffect');
  }

  if (!effectsMap.has(component)) {
    effectsMap.set(component, new Map());
    
    const originalDisconnectedCallback = component.disconnectedCallback;
    component.disconnectedCallback = async function(...args: any[]) {
      const effects = effectsMap.get(component);
      if (effects) {
        for (const [_, effectInfo] of effects) {
          if (effectInfo.cleanup) {
            effectInfo.cleanup();
          }
        }
        effectsMap.delete(component);
      }
      
      if (originalDisconnectedCallback) {
        return originalDisconnectedCallback.apply(this, args);
      }
    };
  }
  
  const effects = effectsMap.get(component)!;
  const effectIndex = effects.size;
  
  const prevEffectInfo = effects.get(effectIndex);
  const { deps } = options;
  
  const hasNoDeps = !deps;
  const depsChanged = prevEffectInfo && deps 
    ? !deps.every((dep, i) => Object.is(dep, prevEffectInfo.deps?.[i]))
    : true;
  
  if (!prevEffectInfo || hasNoDeps || depsChanged) {
    if (prevEffectInfo?.cleanup) {
      prevEffectInfo.cleanup();
    }
    
    const cleanup = effect();
    
    effects.set(effectIndex, {
      cleanup: cleanup as EffectCleanup | undefined,
      deps
    });
  }
}
