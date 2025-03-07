import { Action } from "./store.ts";

export interface ActionCreator<T extends string, P> {
  type: T;
  (payload: P): Action & { payload: P };
}

export function createAction<T extends string>(type: T): ActionCreator<T, void>;
export function createAction<T extends string, P>(type: T): ActionCreator<T, P>;
export function createAction<T extends string, P = void>(
  type: T
): ActionCreator<T, P> {
  const actionCreator = (payload: P) => ({ type, payload });
  actionCreator.type = type;
  return actionCreator as ActionCreator<T, P>;
}

export function isActionType<T extends string, P>(
  action: Action,
  actionCreator: ActionCreator<T, P>
): action is Action & { payload: P } {
  return action.type === actionCreator.type;
}
