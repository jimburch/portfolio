/** Reads JSON the page embedded as `<script type="application/json" id="data-{id}">`; null if missing or invalid. */
export function readPageData<T>(id: string): T | null {
  const node = document.getElementById(`data-${id}`);
  if (!(node instanceof HTMLScriptElement) || node.type !== 'application/json') return null;
  try {
    return JSON.parse(node.textContent ?? '') as T;
  } catch {
    return null;
  }
}
