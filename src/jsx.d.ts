import type { Child } from "./index"

declare global {
  namespace JSX {
    type Element = Node

    interface IntrinsicElements {
      [tagName: string]: Record<string, any> & { children?: Child | Child[] }
    }
  }
}

export {}