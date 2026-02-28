import type { Child } from "../dom/h";
import { toNodes, replaceBetween } from "../dom/region";
import { effect } from "../core/reactivity";
import type { Accessor } from "./accessor";

export function Match(props: {
  when: boolean | Accessor<boolean>;
  children: Child;
}): any {
  return props as any;
}

export function Switch(props: { fallback?: Child; children?: any }): Node {
  const start = document.createComment("p:switch-start");
  const end = document.createComment("p:switch-end");
  const frag = document.createDocumentFragment();
  frag.appendChild(start);
  frag.appendChild(end);

  const getChildren = () => {
    const c = (props as any).children;
    return Array.isArray(c) ? c : c != null ? [c] : [];
  };

  effect(() => {
    let chosen: Child | null = null;

    for (const child of getChildren()) {
      if (!child || typeof child !== "object") continue;
      const whenProp = (child as any).when;
      const ok =
        typeof whenProp === "function"
          ? Boolean(whenProp())
          : Boolean(whenProp);
      if (ok) {
        chosen = (child as any).children ?? null;
        break;
      }
    }

    if (chosen == null) chosen = props.fallback ?? null;
    replaceBetween(start, end, toNodes(chosen));
  });

  return frag;
}
