import { batch, signal } from "../core/reactivity";
import type { ActionDef, ActionInstance, RouteCtx } from "./types";

export function action<TArgs extends any[], TResult>(
  def: Omit<ActionDef<TArgs, TResult>, "__kind">,
): ActionDef<TArgs, TResult> {
  return { __kind: "pendulum_action", ...def };
}

export function isActionDef(x: any): x is ActionDef<any, any> {
  return (
    x &&
    typeof x === "object" &&
    x.__kind === "pendulum_action" &&
    typeof x.run === "function"
  );
}

export function createActionInstance<TArgs extends any[], TResult>(
  def: ActionDef<TArgs, TResult>,
  ctx: RouteCtx,
  cache: Map<string, unknown>,
): ActionInstance<TArgs, TResult> {
  const [pending, setPending] = signal(false);
  const [error, setError] = signal<unknown | null>(null);
  const [result, setResult] = signal<TResult | null>(null);

  let runId = 0;

  const fn = (async (...args: TArgs) => {
    const myRun = ++runId;

    if (def.key && args.length === 0 && cache.has(def.key)) {
      const hit = cache.get(def.key) as TResult;
      batch(() => {
        setPending(false);
        setError(null);
        setResult(hit);
      });
      return hit;
    }

    batch(() => {
      setPending(true);
      setError(null);
    });

    try {
      const res = await def.run(...args);

      if (myRun !== runId) return res as TResult;

      batch(() => {
        setResult(res as TResult);
        setPending(false);
      });

      if (def.key && args.length === 0) cache.set(def.key, res as TResult);

      if (def.success) await def.success(res as TResult, ctx);
      return res as TResult;
    } catch (e) {
      if (myRun !== runId) throw e;

      batch(() => {
        setError(e);
        setPending(false);
      });

      if (def.error) await def.error(e, ctx);
      throw e;
    } finally {
      if (myRun === runId && def.finally) await def.finally(ctx);
    }
  }) as ActionInstance<TArgs, TResult>;

  fn.pending = pending;
  fn.error = error;
  fn.result = result;
  fn.reset = () => {
    runId++;
    batch(() => {
      setPending(false);
      setError(null);
      setResult(null);
    });
  };

  return fn;
}
