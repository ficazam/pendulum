import { defineContract } from "@ficazam31/contract-api";
import { z } from "zod";

const Pokemon = z.object({
  id: z.number(),
  name: z.string(),
  height: z.number(),
  weight: z.number(),
  sprites: z.object({
    front_default: z.string().nullable(),
  }),
});

export type PokemonType = z.infer<typeof Pokemon>;

export const pokemonContract = defineContract({
  "GET /pokemon/:name": {
    auth: "public",
    params: z.object({ name: z.string() }),
    response: Pokemon,
  },
});
