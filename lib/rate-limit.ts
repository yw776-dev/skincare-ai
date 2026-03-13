/**
 * In-memory rate limiter by IP.
 * Limit: 10 requests per minute per IP.
 */

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

const store = new Map<string, number[]>();

function prune(timestamps: number[]): number[] {
  const cutoff = Date.now() - WINDOW_MS;
  return timestamps.filter((t) => t > cutoff);
}

export function checkRateLimit(ip: string): { allowed: boolean } {
  const now = Date.now();
  let timestamps = store.get(ip) ?? [];
  timestamps = prune(timestamps);
  if (timestamps.length >= MAX_REQUESTS) {
    return { allowed: false };
  }
  timestamps.push(now);
  store.set(ip, timestamps);
  return { allowed: true };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
