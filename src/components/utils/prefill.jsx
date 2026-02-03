const KEY = "pd_prefill_cache_v1";
export function savePrefill(obj) {
  try {
    const curr = loadPrefill();
    localStorage.setItem(KEY, JSON.stringify({ ...curr, ...obj }));
  } catch {
    // Ignore storage errors (e.g., private mode or quota exceeded).
  }
}
export function loadPrefill() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}
