import { effect } from "../core/reactivity"
import { attachOwnerToRoot, createOwner, runWithOwner } from "../core/owner"
import { replaceBetween, toNodes } from "./region"
import { setProp, type Props } from "./props"
import { isFragmentNode, isNode } from "./utils"

export type Child =
  | Node
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => any)
  | Child[]

export const Fragment = Symbol.for("pendulum.fragment")

function appendChild(parent: Node, child: Child) {
  if (child == null || child === false || child === true) return

  if (Array.isArray(child)) {
    for (const c of child) appendChild(parent, c)
    return
  }

  if (isNode(child)) {
    if (isFragmentNode(child)) {
      for (const k of Array.from(child.childNodes)) parent.appendChild(k)
      return
    }
    parent.appendChild(child)
    return
  }

  if (typeof child === "function") {
    const start = document.createComment("p:dyn-start")
    const end = document.createComment("p:dyn-end")
    parent.appendChild(start)
    parent.appendChild(end)

    effect(() => {
      const v = child()
      replaceBetween(start, end, toNodes(v))
    })

    return
  }

  parent.appendChild(document.createTextNode(String(child)))
}

export function renderWithOwner<TProps extends object>(
  component: (props: TProps) => Node,
  props: TProps,
): Node {
  const owner = createOwner()

  const start = document.createComment("p:comp-start")
  const end = document.createComment("p:comp-end")
  const frag = document.createDocumentFragment()
  frag.appendChild(start)
  frag.appendChild(end)

  attachOwnerToRoot(start, owner)

  const out = runWithOwner(owner, () => component(props))
  replaceBetween(start, end, toNodes(out))

  return frag
}

export function h(type: any, props: Props | null): Node {
  const p = props ?? {}

  const rawChildren = p.children
  const children =
    rawChildren == null
      ? []
      : Array.isArray(rawChildren)
        ? rawChildren
        : [rawChildren]

  if (typeof type === "function") {
    return renderWithOwner(type, p)
  }

  if (type === Fragment) {
    const frag = document.createDocumentFragment()
    for (const c of children.flat()) appendChild(frag, c as any)
    return frag
  }

  const el = document.createElement(type)
  for (const [k, v] of Object.entries(p)) setProp(el, k, v)
  for (const c of children.flat()) appendChild(el, c as any)
  return el
}