import { disposeNodeTree } from "../core/owner";

export function render(root: Element, node: Node) {
  for (const child of Array.from(root.childNodes)) {
    disposeNodeTree(child);
  }
  root.replaceChildren(node);
}

export const mount = render;
