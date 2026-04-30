import { describe, expect, it } from "vitest";

import { checkRateLimit, getClientIp, resetRateLimitForTests } from "@/lib/rate-limit";

describe("rate limiting", () => {
  it("allows requests within the window and rejects the request over limit", () => {
    resetRateLimitForTests();

    const options = { limit: 2, now: () => 1_000, windowMs: 1_000 };

    expect(checkRateLimit("client-a", options)).toEqual({
      allowed: true,
      limit: 2,
      remaining: 1,
      resetAt: 2_000,
      retryAfterMs: 0,
    });
    expect(checkRateLimit("client-a", options)).toEqual({
      allowed: true,
      limit: 2,
      remaining: 0,
      resetAt: 2_000,
      retryAfterMs: 0,
    });
    expect(checkRateLimit("client-a", options)).toEqual({
      allowed: false,
      limit: 2,
      remaining: 0,
      resetAt: 2_000,
      retryAfterMs: 1_000,
    });
  });

  it("drops expired timestamps from the sliding window", () => {
    resetRateLimitForTests();

    expect(
      checkRateLimit("client-b", {
        limit: 1,
        now: () => 1_000,
        windowMs: 1_000,
      }).allowed,
    ).toBe(true);

    expect(
      checkRateLimit("client-b", {
        limit: 1,
        now: () => 2_001,
        windowMs: 1_000,
      }).allowed,
    ).toBe(true);
  });

  it("uses forwarded IP headers before falling back to an anonymous bucket", () => {
    expect(
      getClientIp(
        new Request("http://localhost/api/quote", {
          headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
        }),
      ),
    ).toBe("203.0.113.10");

    expect(getClientIp(new Request("http://localhost/api/quote"))).toBe(
      "anonymous",
    );
  });
});
