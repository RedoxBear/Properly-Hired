const KEY = "pd_prefill_cache_v1";
export function savePrefill(obj) {
  try {
    const curr = loadPrefill();
    localStorage.setItem(KEY, JSON.stringify({ ...curr, ...obj }));
  } catch {}
}
export function loadPrefill() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}