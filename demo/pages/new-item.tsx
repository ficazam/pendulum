import { signal, type RouteCtx } from "@ficazam31/pendulum";

export const NewItemPage = (ctx: RouteCtx) => {
  const [name, setName] = signal("");
  return (
    <div>
      <h1>New Item</h1>
      <form
        on:submit={(e: SubmitEvent) => {
          e.preventDefault();
          ctx.submit(name());
        }}
      >
        <input bind:value={[name, setName]} />
        <button disabled={ctx.submit.pending}>Create</button>
        {() => ctx.submit.error() && <p>{String(ctx.submit.error())}</p>}
      </form>
    </div>
  );
};
