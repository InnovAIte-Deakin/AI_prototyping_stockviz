export function encodeState(obj: unknown): string {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))) } catch { return '' }
}
export function decodeState<T = any>(s: string | null): T | null {
  if (!s) return null
  try { return JSON.parse(decodeURIComponent(escape(atob(s)))) as T } catch { return null }
}
