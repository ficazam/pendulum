import { createClient } from "@ficazam31/contract-api";
import { pokemonContract } from "./poke.contract";

export const pokemonClient = createClient(pokemonContract, {
  baseUrl: "https://pokeapi.co/api/v2",
});
