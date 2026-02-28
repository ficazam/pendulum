import { mount, action, route, routes } from "@ficazam31/pendulum";
import { HomePage } from "./pages/home";
import { ItemsPage } from "./pages/items";
import { NewItemPage } from "./pages/new-item";
import { pokemonClient } from "./core/poke.client";
import { PokemonPage } from "./pages/pokemon-page";

export type Item = { id: string; name: string };

const fakeDb: Item[] = [
  { id: "1", name: "Apple" },
  { id: "2", name: "Banana" },
];

const homeRoute = route("/", { component: HomePage });

const itemsRoute = route("/items", {
  load: action({
    run: async () => ({ items: [...fakeDb] }),
  }),
  component: ItemsPage,
});

const newItemRoute = route("/new-item", {
  component: NewItemPage,
  submit: action({
    run: async (item: string) => {
      await new Promise((r) => setTimeout(r, 200));
      fakeDb.push({ id: String(Date.now()), name: item });
      return { ok: true };
    },
    success: (_res, ctx) => {
      ctx.invalidate("GET /items");
      ctx.navigate("/items");
    },
  }),
});

const pokemonRoute = route("/pokemon", {
  component: PokemonPage,
  load: action({
    key: "GET /pokemon",
    run: async () =>
      await pokemonClient.call("GET /pokemon/:name", {
        params: { name: "Pikachu" },
      }),
  }),
  search: action({
    run: async (name: string) =>
      await pokemonClient.call("GET /pokemon/:name", { params: { name } }),
    success: (_p, ctx) => ctx.invalidate("GET /pokemon"),
  }),
});

const App = routes(homeRoute, itemsRoute, newItemRoute, pokemonRoute);
mount(document.getElementById("app")!, <App />);
