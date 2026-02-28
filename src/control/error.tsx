import type { Child } from "../dom/h";

export function ErrorView(props: {
  error: unknown;
  title?: string;
  children?: Child;
}): Node {
  const msg =
    props.error instanceof Error ? props.error.message : String(props.error);

  return (
    <div className="p-4 border rounded">
      <strong>{props.title ?? "Something went wrong"}</strong>
      <pre style="white-space:pre-wrap">{msg}</pre>
      {props.children}
    </div>
  ) as unknown as Node;
}
