import {
  createOwner,
  disposeOwner,
  getCurrentOwner,
  setCurrentOwner,
  __registerCleanup,
} from "./owner";

export type Cleanup = () => void;

// -------------------------
// Scheduler
// -------------------------

let BATCH_DEPTH = 0;
let FLUSHING = false;
let FLUSH_SCHEDULED = false;

const QUEUE = new Set<Computation>();

function schedule(c: Computation) {
  if (c.disposed) return;
  QUEUE.add(c);

  if (BATCH_DEPTH > 0) return;
  if (FLUSH_SCHEDULED) return;

  FLUSH_SCHEDULED = true;
  queueMicrotask(flush);
}

function flush() {
  if (FLUSHING) return;
  FLUSHING = true;
  FLUSH_SCHEDULED = false;

  try {
    while (QUEUE.size > 0) {
      const run = Array.from(QUEUE);
      QUEUE.clear();
      for (const c of run) c.run();
    }
  } finally {
    FLUSHING = false;
  }
}

export function batch(fn: () => void) {
  BATCH_DEPTH++;
  try {
    fn();
  } finally {
    BATCH_DEPTH--;
    if (BATCH_DEPTH === 0) flush();
  }
}

// -------------------------
// Dependency graph
// -------------------------

type SignalImpl = {
  value: unknown;
  observers: Set<Computation>;
};

type Computation = {
  owner: ReturnType<typeof createOwner>;
  fn: () => void;
  deps: Set<SignalImpl>;
  disposed: boolean;
  scheduled: boolean;
  run: () => void;
};

let CURRENT_COMP: Computation | null = null;

function cleanupDeps(c: Computation) {
  for (const s of c.deps) s.observers.delete(c);
  c.deps.clear();
}

function track(s: SignalImpl) {
  const c = CURRENT_COMP;
  if (!c) return;
  if (!c.deps.has(s)) {
    c.deps.add(s);
    s.observers.add(c);
  }
}

function notify(s: SignalImpl) {
  for (const c of Array.from(s.observers)) {
    if (c.disposed) continue;
    if (c.scheduled) continue;
    c.scheduled = true;
    schedule(c);
  }
}

// -------------------------
// Public API
// -------------------------

export function untrack<T>(fn: () => T): T {
  const prev = CURRENT_COMP;
  CURRENT_COMP = null;
  try {
    return fn();
  } finally {
    CURRENT_COMP = prev;
  }
}

export function signal<T>(initial: T) {
  const s: SignalImpl = { value: initial, observers: new Set() };

  const get = () => {
    track(s);
    return s.value as T;
  };

  const set = (next: T | ((prev: T) => T)) => {
    const prev = s.value as T;
    const nextValue = typeof next === "function" ? (next as any)(prev) : next;
    if (Object.is(nextValue, prev)) return;
    s.value = nextValue;
    notify(s);
  };

  return [get, set] as const;
}

export function effect(fn: () => void): Cleanup {
  const owner = createOwner();

  const c: Computation = {
    owner,
    fn,
    deps: new Set(),
    disposed: false,
    scheduled: false,
    run: () => {
      if (c.disposed) return;
      c.scheduled = false;

      cleanupDeps(c);

      const prevComp = CURRENT_COMP;
      const prevOwner = getCurrentOwner();

      CURRENT_COMP = c;
      setCurrentOwner(owner);

      try {
        fn();
      } finally {
        CURRENT_COMP = prevComp;
        setCurrentOwner(prevOwner);
      }
    },
  };

  c.run();

  const cleanup = () => {
    if (c.disposed) return;
    c.disposed = true;
    cleanupDeps(c);
    disposeOwner(owner);
  };

  __registerCleanup(cleanup);
  return cleanup;
}
