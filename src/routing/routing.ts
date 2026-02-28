import { effect, signal, untrack } from "../core/reactivity";
import { onCleanup, disposeNodeTree } from "../core/owner";
import { renderWithOwner } from "../dom/h";
import { isActionDef, createActionInstance } from "./action";
import { withRouteCtx } from "./context";
import { matchPath } from "./match";
import type { AnyRoute, RouteDef, CtxFromRouteDef } from "./types";

export function route<TDef extends Record<string, any>>(
  path: string,
  def: TDef & { component: (ctx: CtxFromRouteDef<TDef>) => Node },
): RouteDef<TDef> {
  return { path, ...def } as any;
}

function replaceChildrenWithDisposal(root: Element, next: Node) {
  for (const child of Array.from(root.childNodes)) disposeNodeTree(child);
  root.replaceChildren(next);
}

export function routes(...defs: AnyRoute[]) {
  return function Router() {
    const root = document.createElement("div");

    const [path, setPath] = signal(
      window.location.pathname + window.location.search,
    );

    const navigate = (to: string) => {
      if (to === path()) return;
      window.history.pushState({}, "", to);
      setPath(window.location.pathname + window.location.search);
    };

    const onPop = () =>
      setPath(window.location.pathname + window.location.search);
    window.addEventListener("popstate", onPop);
    onCleanup(() => window.removeEventListener("popstate", onPop));

    const cache = new Map<string, unknown>();
    const invalidation = new Map<string, ReturnType<typeof signal<number>>>();

    const getInv = (key: string) => {
      let s = invalidation.get(key);
      if (!s) {
        s = signal(0);
        invalidation.set(key, s);
      }
      return s;
    };

    const invalidate = (key: string) => {
      cache.delete(key);
      const [get, set] = getInv(key);
      set(get() + 1);
    };

    let disposePrevRoute: (() => void) | null = null;
    onCleanup(() => disposePrevRoute?.());

    let lastRouteKey: string | null = null;

    let activeCtx: any = null;

    effect(() => {
      const full = path();
      const url = new URL(full, window.location.origin);
      const pathname = url.pathname;
      const search = url.search;

      let match: { d: AnyRoute; params: Record<string, string> } | null = null;
      for (const d of defs) {
        const params = matchPath(d.path, pathname);
        if (!params) continue;
        match = { d, params };
        break;
      }

      untrack(() => {
        if (!match) {
          disposePrevRoute?.();
          disposePrevRoute = null;
          activeCtx = null;
          lastRouteKey = null;
          replaceChildrenWithDisposal(
            root,
            document.createTextNode("Not Found"),
          );
          return;
        }

        const { d, params } = match;

        const routeKey = `${d.path}::${pathname}::${search}`;

        if (lastRouteKey !== routeKey) {
          lastRouteKey = routeKey;

          disposePrevRoute?.();
          disposePrevRoute = null;

          const query = () =>
            Object.fromEntries(new URLSearchParams(search).entries());

          const ctx: any = { path, params, query, navigate, invalidate };

          for (const [k, v] of Object.entries(d)) {
            if (k === "path" || k === "component") continue;
            if (isActionDef(v)) ctx[k] = createActionInstance(v, ctx, cache);
          }

          activeCtx = ctx;

          const loadFn = ctx.load;
          if (typeof loadFn === "function") void loadFn();

          const loadDef = (d as any).load;
          const loadKey: string | undefined =
            loadDef && isActionDef(loadDef) ? loadDef.key : undefined;

          if (loadKey) {
            const [getTick] = getInv(loadKey);
            let lastSeen = getTick();

            const stop = effect(() => {
              const t = getTick();
              if (t === lastSeen) return;
              lastSeen = t;
              untrack(() => {
                const lf = activeCtx?.load;
                if (typeof lf === "function") void lf();
              });
            });

            disposePrevRoute = stop;
          }

          const node = withRouteCtx(ctx, () =>
            renderWithOwner(d.component as any, ctx),
          );

          replaceChildrenWithDisposal(root, node);
        }
      });
    });

    return root;
  };
}
