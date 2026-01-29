export function wordDiff(oldText, newText) {
  const a = (oldText || "").split(/\s+/);
  const b = (newText || "").split(/\s+/);
  const dp = Array(a.length + 1)
    .fill(0)
    .map(() => Array(b.length + 1).fill(0));

  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out = [];
  let i = 0,
    j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ text: a[i], del: true });
      i++;
    } else {
      out.push({ text: b[j], add: true });
      j++;
    }
  }
  while (i < a.length) out.push({ text: a[i++], del: true });
  while (j < b.length) out.push({ text: b[j++], add: true });
  return out;
}