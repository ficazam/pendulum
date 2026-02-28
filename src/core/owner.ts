export type Owner = {
  cleanups: (() => void)[]
  parent: Owner | null
}

let CURRENT_OWNER: Owner | null = null

export function getCurrentOwner(): Owner | null {
  return CURRENT_OWNER
}

export function setCurrentOwner(next: Owner | null): Owner | null {
  const prev = CURRENT_OWNER
  CURRENT_OWNER = next
  return prev
}

export function createOwner(): Owner {
  return {
    cleanups: [],
    parent: CURRENT_OWNER,
  }
}

export function runWithOwner<T>(owner: Owner, fn: () => T): T {
  const prev = setCurrentOwner(owner)
  try {
    return fn()
  } finally {
    setCurrentOwner(prev)
  }
}

function registerCleanup(fn: () => void) {
  if (CURRENT_OWNER) CURRENT_OWNER.cleanups.push(fn)
}

export function onCleanup(fn: () => void) {
  registerCleanup(fn)
}

export function disposeOwner(owner: Owner) {
  for (const cleanup of owner.cleanups) cleanup()
  owner.cleanups.length = 0
}

// -------------------------
// Node ownership + disposal
// -------------------------

const OWNER = Symbol.for("pendulum.owner")
type OwnedNode = Node & { [OWNER]?: Owner }

function getOwnerForNode(n: Node): Owner | null {
  return (n as OwnedNode)[OWNER] ?? null
}

function setOwnerForNode(n: Node, owner: Owner) {
  ;(n as OwnedNode)[OWNER] = owner
}

export function attachOwnerToRoot(node: Node, owner: Owner) {
  if (node.nodeType === 11) {
    for (const c of Array.from((node as DocumentFragment).childNodes)) {
      setOwnerForNode(c, owner)
    }
  } else {
    setOwnerForNode(node, owner)
  }
}

export function disposeNodeTree(root: Node) {
  const seen = new Set<Owner>()

  const maybeDispose = (n: Node) => {
    const o = getOwnerForNode(n)
    if (o && !seen.has(o)) {
      seen.add(o)
      disposeOwner(o)
    }
  }

  const walk = (n: Node) => {
    maybeDispose(n)
    let c = n.firstChild
    while (c) {
      walk(c)
      c = c.nextSibling
    }
  }

  walk(root)
}

export function __registerCleanup(fn: () => void) {
  registerCleanup(fn)
}