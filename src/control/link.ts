import { useRoute } from "../routing";
import type { Child } from "../dom/h";
import { h } from "../dom/h";

export function Link(props: { to: string; children?: Child }): Node {
  const ctx = useRoute();

  return h("a", {
    href: props.to,
    "on:click": (e: MouseEvent) => {
      e.preventDefault();
      ctx.navigate(props.to);
    },
    children: props.children,
  });
}
