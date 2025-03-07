import { Selector } from "./store.ts";

export function createSelector<State, Result>(
  ...args: [...Selector<State, any>[], (...args: any[]) => Result]
): Selector<State, Result> {
  const selectors = args.slice(0, -1) as Selector<State, any>[];
  const projector = args[args.length - 1] as (...args: any[]) => Result;

  let lastArgs: any[] | null = null;
  let lastResult: Result | null = null;

  return (state: State) => {
    const newArgs = selectors.map((selector) => selector(state));

    if (
      lastArgs === null ||
      lastArgs.length !== newArgs.length ||
      lastArgs.some((arg, i) => arg !== newArgs[i])
    ) {
      lastArgs = newArgs;
      lastResult = projector(...newArgs);
    }

    return lastResult!;
  };
}

export function createFeatureSelector<State, FeatureState>(
  featureKey: keyof State
): Selector<State, FeatureState> {
  return (state: State) => state[featureKey] as unknown as FeatureState;
}
