import type { RouteCtx } from "./types"

let CURRENT_ROUTE_CTX: RouteCtx | null = null

export function useRoute<T = RouteCtx>(): T {
  if (!CURRENT_ROUTE_CTX) {
    throw new Error("useRoute() must be used inside a route component")
  }
  return CURRENT_ROUTE_CTX as T
}

export function withRouteCtx<T>(ctx: RouteCtx, fn: () => T): T {
  const prev = CURRENT_ROUTE_CTX
  CURRENT_ROUTE_CTX = ctx
  try {
    return fn()
  } finally {
    CURRENT_ROUTE_CTX = prev
  }
}