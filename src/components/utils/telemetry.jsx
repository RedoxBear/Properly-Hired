
export const KEY_PD_EVENTS = "pd_events_v1";

// Cap local history to avoid unbounded growth
const capLocal = (arr, max = 5000) => {
  if (arr.length > max) arr.splice(0, arr.length - max);
  return arr;
};

export async function logEvent(ev) {
  const enriched = {
    ...ev,
    ts: ev?.ts || new Date().toISOString(),
  };

  // Try to send to server (non-blocking)
  try {
    await fetch("/api/v1/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(enriched),
    });
  } catch {
    // ignore network errors
  }

  // Always mirror to local storage for Insights fallback/merge
  try {
    const arr = JSON.parse(localStorage.getItem(KEY_PD_EVENTS) || "[]");
    arr.push(enriched);
    localStorage.setItem(KEY_PD_EVENTS, JSON.stringify(capLocal(arr)));
  } catch {
    // ignore storage errors
  }
}

export async function readEvents() {
  let serverEvents = [];
  try {
    const r = await fetch("/api/v1/events?limit=5000", { credentials: "include" });
    if (r.ok) serverEvents = await r.json();
  } catch {
    // ignore network errors
  }

  let localEvents = [];
  try {
    localEvents = JSON.parse(localStorage.getItem(KEY_PD_EVENTS) || "[]");
  } catch {
    localEvents = [];
  }

  // Merge and de-duplicate by key (type+ts+app_id/url)
  const seen = new Set();
  const merged = [];
  const all = [...serverEvents, ...localEvents];
  for (const e of all) {
    const k = [
      e?.type || "unknown",
      e?.ts || "",
      e?.app_id || "",
      e?.url || "",
      e?.vendor || "",
    ].join("|");
    if (!seen.has(k)) {
      seen.add(k);
      merged.push(e);
    }
  }

  // Sort by ts ascending for charts
  merged.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  return merged;
}
