import { h, Fragment, type Child } from "../dom/h"

type Accessor<T> = () => T

export function Show<T>(props: {
  when: Accessor<T | null | undefined>
  fallback?: Child
  then: (value: T) => Child
}): Node {
  return h(Fragment, {
    children: () => {
      const v = props.when()
      if (v == null) return props.fallback ?? null
      return props.then(v)
    },
  })
}