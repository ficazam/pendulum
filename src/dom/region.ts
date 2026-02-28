import { disposeNodeTree } from "../core/owner"
import { isFragmentNode, isNode } from "./utils"

export function toNodes(v: any): Node[] {
  if (v == null || v === false || v === true) return []

  if (Array.isArray(v)) return v.flatMap(toNodes)

  if (isNode(v)) {
    if (isFragmentNode(v)) return Array.from(v.childNodes)
    return [v]
  }

  if (typeof v === "function") return toNodes(v())

  return [document.createTextNode(String(v))]
}

export function replaceBetween(
  start: Comment,
  end: Comment,
  nextNodes: Node[],
) {
  let n = start.nextSibling
  while (n && n !== end) {
    const rm = n
    n = n.nextSibling
    disposeNodeTree(rm)
    rm.parentNode?.removeChild(rm)
  }

  const frag = document.createDocumentFragment()
  for (const node of nextNodes) frag.appendChild(node)
  end.parentNode!.insertBefore(frag, end)
}