// Shared HTTP helpers for the data-fetch scripts.
// Node 18+ (built-in fetch). Adds a browser-like UA, timeout, and retries so the
// undocumented ESPN / stats.nba.com endpoints behave.

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch a URL and parse JSON, with timeout + linear-backoff retries.
 * @param {string} url
 * @param {object} [opts]
 * @param {Record<string,string>} [opts.headers]
 * @param {number} [opts.retries]
 * @param {number} [opts.timeoutMs]
 */
export async function fetchJson(url, { headers = {}, retries = 3, timeoutMs = 20000 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json', ...headers },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await sleep(attempt * 1500);
    }
  }
  throw new Error(`Failed after ${retries} attempts: ${url}\n  ${lastErr?.message}`);
}

// Headers required to talk to stats.nba.com (Akamai checks Referer/Origin).
export const NBA_STATS_HEADERS = {
  Referer: 'https://www.nba.com/',
  Origin: 'https://www.nba.com',
  'x-nba-stats-origin': 'stats',
  'x-nba-stats-token': 'true',
};
