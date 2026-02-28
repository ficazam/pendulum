import { batch, effect, signal, untrack } from "./reactivity";

export type Accessor<T> = () => T;

export type Resource<T> = Accessor<T | null> & {
  loading: Accessor<boolean>;
  error: Accessor<unknown | null>;
  refetch: () => void;
  mutate: (next: T | null) => void;
};

export function createResource<TKey, TData>(
  key: Accessor<TKey>,
  fetcher: (key: TKey) => Promise<TData> | TData,
  opts?: {
    initial?: TData | null;
    keepPrevious?: boolean;
    immediate?: boolean;
  },
): Resource<TData> {
  const initial = opts?.initial ?? null;
  const keepPrevious = opts?.keepPrevious ?? true;
  const immediate = opts?.immediate ?? true;

  const [data, setData] = signal<TData | null>(initial);
  const [loading, setLoading] = signal(false);
  const [error, setError] = signal<unknown | null>(null);

  let version = 0;

  const run = async () => {
    const v = ++version;
    batch(() => {
      setLoading(true);
      setError(null);
      if (!keepPrevious) setData(null);
    });

    try {
      const k = untrack(key);
      const res = await fetcher(k);
      if (v !== version) return;
      batch(() => {
        setData(res as TData);
        setLoading(false);
      });
    } catch (e) {
      if (v !== version) return;
      batch(() => {
        setError(e);
        setLoading(false);
      });
    }
  };

  if (immediate) {
    effect(() => {
      key();
      void run();
    });
  }

  const accessor = (() => data()) as Resource<TData>;
  accessor.loading = loading;
  accessor.error = error;
  accessor.refetch = () => void run();
  accessor.mutate = (next) => setData(next);

  return accessor;
}
