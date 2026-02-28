export function isNode(x: any): x is Node {
  return x && typeof x === "object" && typeof x.nodeType === "number"
}

export function isFragmentNode(n: Node): n is DocumentFragment {
  return n.nodeType === 11
}