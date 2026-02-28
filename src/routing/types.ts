export type RouteCtx = {
  path: () => string
  params: Record<string, string>
  query: () => Record<string, string>
  navigate: (to: string) => void
  invalidate: (key: string) => void
  [k: string]: any
}

export type ActionInstance<TArgs extends any[], TResult> = ((
  ...args: TArgs
) => Promise<TResult>) & {
  pending: () => boolean
  error: () => unknown | null
  result: () => TResult | null
  reset: () => void
}

export type ActionDef<TArgs extends any[], TResult> = {
  __kind: "pendulum_action"
  key?: string
  run: (...args: TArgs) => Promise<TResult> | TResult
  success?: (result: TResult, ctx: RouteCtx) => void | Promise<void>
  error?: (err: unknown, ctx: RouteCtx) => void | Promise<void>
  finally?: (ctx: RouteCtx) => void | Promise<void>
}

export type AnyActionDef = ActionDef<any[], any>

type InferActionInstance<T> =
  T extends ActionDef<infer A, infer R> ? ActionInstance<A, R> : never

export type CtxFromRouteDef<TDef> = {
  path: () => string
  params: Record<string, string>
  query: () => Record<string, string>
  navigate: (to: string) => void
  invalidate: (key: string) => void
} & {
  [K in keyof TDef as TDef[K] extends AnyActionDef ? K : never]:
    InferActionInstance<TDef[K]>
}

export type RouteDef<TDef extends Record<string, any>> = {
  path: string
} & TDef & {
  component: (ctx: CtxFromRouteDef<TDef>) => Node
}

export type AnyRoute = RouteDef<any>

export type RouteComponent<TRoute> =
  TRoute extends RouteDef<infer TDef> ? (ctx: CtxFromRouteDef<TDef>) => Node : never