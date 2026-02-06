const addH = (d, hours) => new Date(d.getTime() + hours*60*60*1000).toISOString();

export function schedule48_72(appliedAtISO) {
  const base = new Date(appliedAtISO);
  return [addH(base, 48), addH(base, 72)];
}

export function nextFollowUp(scheduled = [], history = []) {
  const doneHours = new Set((history||[]).map(h=> new Date(h.ts).toISOString().slice(0,13)));
  const next = (scheduled||[]).find(ts => !doneHours.has(new Date(ts).toISOString().slice(0,13)));
  return next || null;
}