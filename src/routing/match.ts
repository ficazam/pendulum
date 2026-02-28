export function matchPath(
  pattern: string,
  pathname: string,
): null | Record<string, string> {
  const p = pattern.split("/").filter(Boolean)
  const a = pathname.split("/").filter(Boolean)
  if (p.length !== a.length) return null

  const params: Record<string, string> = {}
  for (let i = 0; i < p.length; i++) {
    const seg = p[i]!
    const cur = a[i]!
    if (seg.startsWith(":")) params[seg.slice(1)] = decodeURIComponent(cur)
    else if (seg !== cur) return null
  }
  return params
}