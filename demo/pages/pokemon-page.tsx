import { Show, signal, useRoute } from "@ficazam31/pendulum";
import { type PokemonType } from "../core/poke.contract";

export const PokemonPage = () => {
  const ctx = useRoute();
  const [name, setName] = signal("");

  const submit = async (e: Event) => {
    e.preventDefault();

    const n = name().trim().toLowerCase();
    if (!n) return;

    await ctx.search(n);
  };

  return (
    <div>
      <h2>Pokedex</h2>
      <form on:submit={submit}>
        <input bind:value={[name, setName]} placeholder="Pikachu" />
        <button disabled={() => ctx.search.pending()}>
          {() => (ctx.search.pending() ? "Searching..." : "Search")}
        </button>
      </form>

      <p>
        load.pending: {() => String(ctx.load.pending())} | search.pending:{" "}
        {() => String(ctx.search.pending())}
      </p>
      <p>search.result: {() => JSON.stringify(ctx.search.result())}</p>

      <Show
        when={() =>
          (ctx.search.result() ?? ctx.load.result()) as PokemonType | null
        }
        fallback={<p>Loading…</p>}
        then={(p: PokemonType) => (
          <div>
            <h3>
              #{p.id} — {p.name}
            </h3>
            <p>
              height: {p.height} | weight: {p.weight}
            </p>
            <Show
              when={() => p.sprites.front_default}
              fallback={<p>No sprite</p>}
              then={(url) => <img src={url} alt={p.name} />}
            />
          </div>
        )}
      />

      <Show
        when={() => (ctx.search.error() ?? ctx.load.error()) as unknown | null}
        fallback={null}
        then={(e) => <p>Error: {String(e)}</p>}
      />
    </div>
  );
};
