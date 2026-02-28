import type { Item } from "demo/router";
import { For, Link, Show, type RouteCtx } from "@ficazam31/pendulum";

export const ItemsPage = (ctx: RouteCtx) => (
  <>
    <Link to="/new-item">Add Item</Link>
    <p>pending: {() => String(ctx.load.pending())}</p>
    <p>error: {() => String(ctx.load.error())}</p>
    <p>result: {() => JSON.stringify(ctx.load.result())}</p>

    <Show<{ items: Item[] }>
      when={ctx.load.result}
      fallback={<p>Loading…</p>}
      then={(res) => (
        <For
          each={() => res.items}
          key={(i) => i.id}
          children={(i) => <p>{i.name}</p>}
        />
      )}
    />
  </>
);
