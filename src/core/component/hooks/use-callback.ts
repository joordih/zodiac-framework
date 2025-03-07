import { useMemo } from "./use-memo.ts";

export function useCallback<T extends (...args: any[]) => any>(
  component: any,
  callback: T,
  deps?: any[]
): T {
  return useMemo(component, () => callback, deps);
}
