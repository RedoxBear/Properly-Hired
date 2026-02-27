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

  // Store locally for Insights
  try {
    const arr = JSON.parse(localStorage.getItem(KEY_PD_EVENTS) || "[]");
    arr.push(enriched);
    localStorage.setItem(KEY_PD_EVENTS, JSON.stringify(capLocal(arr)));
  } catch {
    // ignore storage errors
  }
}

export async function readEvents() {
  let localEvents = [];
  try {
    localEvents = JSON.parse(localStorage.getItem(KEY_PD_EVENTS) || "[]");
  } catch {
    localEvents = [];
  }

  // Sort by ts ascending for charts
  localEvents.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  return localEvents;
}