import { useRoute } from "./context";

export function useParams<
  T extends Record<string, string> = Record<string, string>,
>() {
  return useRoute().params as T;
}

export function useQuery<
  T extends Record<string, string> = Record<string, string>,
>() {
  return useRoute().query() as T;
}
