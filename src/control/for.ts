import { h, Fragment, type Child } from "../dom/h";

type Accessor<T> = () => T;

export function For<T>(props: {
  each: Accessor<T[]> | T[];
  children: (item: T, index: number) => Child;
  key?: (item: T) => string | number;
}): Node {
  const get: Accessor<T[]> =
    typeof props.each === "function"
      ? (props.each as Accessor<T[]>)
      : () => props.each as T[];

  if (!props.key) {
    return h(Fragment, {
      children: () => {
        const arr = get() ?? [];
        return arr.map((item, i) => props.children(item, i));
      },
    });
  }

  const keyFn = props.key;
  const cache = new Map<string | number, Node>();

  return h(Fragment, {
    children: () => {
      const arr = get() ?? [];
      const next: Node[] = [];

      for (let i = 0; i < arr.length; i++) {
        const item = arr[i]!;
        const k = keyFn(item);

        let node = cache.get(k);
        if (!node) {
          const out = props.children(item, i);
          node = h(Fragment, { children: out }) as unknown as Node;
          cache.set(k, node);
        }

        next.push(node);
      }

      // cleanup removed keys
      const seen = new Set(arr.map(keyFn));
      for (const k of Array.from(cache.keys())) {
        if (!seen.has(k)) cache.delete(k);
      }

      return next;
    },
  });
}
