import { effect } from "../core/reactivity";
import { onCleanup } from "../core/owner";

export type Props = Record<string, any> & { children?: any };

function normalizeKey(key: string) {
  if (key === "className") return "class";
  if (key === "htmlFor") return "for";
  return key;
}

function toClassValue(v: any): string | null {
  if (v == null || v === false) return null;
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    return v.map(toClassValue).filter(Boolean).join(" ") || null;
  }
  if (typeof v === "object") {
    return (
      Object.entries(v)
        .filter(([, on]) => Boolean(on))
        .map(([k]) => k)
        .join(" ") || null
    );
  }
  return String(v);
}

export function setProp(el: Element, key: string, value: any) {
  key = normalizeKey(key);
  if (key === "children") return;

  if (key.startsWith("on:") && typeof value === "function") {
    const eventName = key.slice(3);
    const handler = value as EventListener;
    el.addEventListener(eventName, handler);
    onCleanup(() => el.removeEventListener(eventName, handler));
    return;
  }

  if (key === "bind:value") {
    const [get, set] = value as readonly [() => any, (v: any) => void];

    effect(() => {
      applyProp(el, "value", get());
    });

    const handler = (e: Event) => {
      const target = e.currentTarget as HTMLInputElement;
      set(target.value);
    };
    el.addEventListener("input", handler);
    onCleanup(() => el.removeEventListener("input", handler));
    return;
  }

  if (key === "bind:checked") {
    const [get, set] = value as readonly [() => any, (v: any) => void];

    effect(() => {
      const v = Boolean(get());
      if (el instanceof HTMLInputElement) el.checked = v;
    });

    const handler = (e: Event) => {
      const t = e.currentTarget as HTMLInputElement;
      set(Boolean(t.checked));
    };
    el.addEventListener("change", handler);
    onCleanup(() => el.removeEventListener("change", handler));
    return;
  }

  if (key === "bind:number") {
    const [get, set] = value as readonly [() => any, (v: any) => void];

    effect(() => {
      const v = get();
      applyProp(el, "value", v ?? "");
    });

    const handler = (e: Event) => {
      const t = e.currentTarget as HTMLInputElement;
      const n = t.value === "" ? null : Number(t.value);
      set(Number.isNaN(n) ? null : n);
    };
    el.addEventListener("input", handler);
    onCleanup(() => el.removeEventListener("input", handler));
    return;
  }

  if (typeof value === "function") {
    effect(() => {
      applyProp(el, key, value());
    });
    return;
  }

  applyProp(el, key, value);
}

export function applyProp(el: Element, key: string, value: any) {
  key = normalizeKey(key);
  if (key === "value" && el instanceof HTMLInputElement) {
    const next = value == null ? "" : String(value);
    if (el.value !== next) el.value = next;
    return;
  }

  if (key === "disabled" && el instanceof HTMLButtonElement) {
    el.disabled = Boolean(value);
    return;
  }

  if (key === "class") {
    const cls = toClassValue(value);
    if (!cls) {
      el.removeAttribute("class");
      return;
    }
    el.setAttribute("class", cls);
    return;
  }

  if (value == null || value === false) {
    el.removeAttribute(key);
    return;
  }

  if (value === true) {
    el.setAttribute(key, "");
    return;
  }

  el.setAttribute(key, String(value));
}
