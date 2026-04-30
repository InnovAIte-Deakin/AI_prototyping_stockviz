import { describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

import { handleAuthProxy } from "@/utils/supabase/proxy-auth";
import { updateSession } from "@/lib/supabase/proxy";

vi.mock("@/lib/supabase/proxy", () => ({
  updateSession: vi.fn(),
}));

const mockedUpdateSession = vi.mocked(updateSession);
type ProxySession = Awaited<ReturnType<typeof updateSession>>;

const requestFor = (path: string) =>
  new NextRequest(new URL(path, "https://stockviz.test"));

const mockSession = (user: unknown = null) => {
  mockedUpdateSession.mockImplementation(async (request) => {
    const session = {
      response: NextResponse.next({ request }),
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user } }),
        },
      },
    };

    return session as unknown as ProxySession;
  });
};

describe("handleAuthProxy", () => {
  it("allows public API routes without redirecting unauthenticated users", async () => {
    mockSession();

    const response = await handleAuthProxy(requestFor("/api/quote?symbol=AAPL"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects unauthenticated protected routes to login with a return target", async () => {
    mockSession();

    const response = await handleAuthProxy(requestFor("/dashboard?tab=home"));

    expect(response.headers.get("location")).toBe(
      "https://stockviz.test/login?next=%2Fdashboard%3Ftab%3Dhome",
    );
  });

  it("redirects authenticated users away from auth pages", async () => {
    mockSession({ id: "user-1" });

    const response = await handleAuthProxy(requestFor("/login"));

    expect(response.headers.get("location")).toBe(
      "https://stockviz.test/dashboard",
    );
  });

  it("allows auth callback routes even when a session already exists", async () => {
    mockSession({ id: "user-1" });

    const response = await handleAuthProxy(requestFor("/auth/callback"));

    expect(response.headers.get("location")).toBeNull();
  });
});
