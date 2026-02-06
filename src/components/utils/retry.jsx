export async function retryWithBackoff(task, options = {}) {
  const {
    retries = 3,
    baseDelay = 1000, // milliseconds
    factor = 2,
    jitter = 0.2, // 20% jitter
  } = options;

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await task();
    } catch (err) {
      const status = err?.response?.status || err?.status;
      const is429 = status === 429 || /429/.test(String(err?.message || ""));
      if (!is429 || attempt >= retries) {
        throw err;
      }
      const delay =
        baseDelay * Math.pow(factor, attempt) * (1 + (Math.random() * 2 - 1) * jitter);
      await new Promise((r) => setTimeout(r, delay));
      attempt += 1;
    }
  }
}