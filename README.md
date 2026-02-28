# Pendulum

Pendulum is a tiny Solid-style UI runtime: signals + fine-grained effects + owner-based cleanup, with a simple router + actions model.

**Status:** experimental. APIs may change.

## Why

- **Fast updates**: reactive signals update only what changed
- **Small surface area**: minimal primitives you can understand in one sitting
- **Typed routing/actions**: route context exposes actions (load/submit/etc.) with typed state

## Features

- Signals (`signal`) + effects (`effect`) + batching (`batch`)
- JSX runtime (`react-jsx` compatible via `jsxImportSource`)
- DOM renderer with owner disposal (no leaking effects/listeners on unmount)
- Router: `route()` / `routes()` + `useRoute()` + `useParams()` + `useQuery()`
- Actions: `action()` instances with `.pending()/.error()/.result()/.reset()`
- Resources: `createResource()` (race-safe, refetch, mutate)
- Control components: `<Show />`, `<For />` (keyed), `<Switch />`, `<Match />`
- Bindings: `bind:value`, `bind:checked`, `bind:number`

## Install

> Not published yet. For now, use this repo locally.

## TSConfig (JSX)

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@ficazam31/pendulum"
  }
}
```

## Quick example

```tsx
import { signal } from "@ficazam31/pendulum";

export function Counter() {
  const [count, setCount] = signal(0);

  return (
    <button on:click={() => setCount((c) => c + 1)}>
      Count: {() => count()}
    </button>
  );
}
```

## Router + actions

```tsx
import { routes, route, action, Show, For, Link } from "@ficazam31/pendulum";

const itemsRoute = route("/items", {
  load: action({
    key: "GET /items",
    run: async () => ({ items: [{ id: "1", name: "Apple" }] }),
  }),
  component: (ctx) => (
    <div>
      <h2>Items</h2>

      <Show
        when={ctx.load.result}
        fallback={<p>Loading…</p>}
        then={(res: { items: { id: string; name: string }[] }) => (
          <For each={res.items} key={(i) => i.id}>
            {(i) => <p>{i.name}</p>}
          </For>
        )}
      />

      <Link to="/new">Add item</Link>
    </div>
  ),
});

export const App = routes(itemsRoute);
```

## License

MIT
