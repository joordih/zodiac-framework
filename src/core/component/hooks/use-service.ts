import { SauceContainer } from "../../injection/sauceContainer.ts";
import { InjectionToken } from "../../injection/injection-token.ts";
import { useMemo } from "./use-memo.ts";

export function useService<T>(
  component: any,
  token: string | InjectionToken<T>
): T {
  return useMemo(
    component,
    () => SauceContainer.resolve<T>(token),
    []
  );
}
