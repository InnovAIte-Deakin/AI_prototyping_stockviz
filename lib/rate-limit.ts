import { NextResponse } from "next/server";

export type RateLimitOptions = {
  limit?: number;
  now?: () => number;
  windowMs?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
};

const DEFAULT_LIMIT = 60;
const DEFAULT_WINDOW_MS = 60_000;

const buckets = new Map<string, number[]>();

export const getClientIp = (request: Request): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwarded?.split(",").at(0)?.trim();
  if (firstForwardedIp) {
    return firstForwardedIp;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || "anonymous";
};

export const checkRateLimit = (
  key: string,
  options: RateLimitOptions = {},
): RateLimitResult => {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const now = options.now?.() ?? Date.now();
  const windowStart = now - windowMs;
  const timestamps = (buckets.get(key) ?? []).filter(
    (timestamp) => timestamp > windowStart,
  );
  const oldestTimestamp = timestamps.at(0);
  const resetAt = oldestTimestamp == null ? now + windowMs : oldestTimestamp + windowMs;

  if (timestamps.length >= limit) {
    buckets.set(key, timestamps);
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt,
      retryAfterMs: Math.max(resetAt - now, 0),
    };
  }

  timestamps.push(now);
  buckets.set(key, timestamps);

  return {
    allowed: true,
    limit,
    remaining: Math.max(limit - timestamps.length, 0),
    resetAt,
    retryAfterMs: 0,
  };
};

export const enforceRateLimit = (
  request: Request,
  options?: RateLimitOptions,
): Response | null => {
  const result = checkRateLimit(getClientIp(request), options);
  if (result.allowed) {
    return null;
  }

  return NextResponse.json(
    { error: "Too many requests" },
    {
      headers: {
        "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
      status: 429,
    },
  );
};

export const resetRateLimitForTests = () => {
  buckets.clear();
};
