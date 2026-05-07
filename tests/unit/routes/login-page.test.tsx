import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/auth/actions", () => ({
  login: vi.fn(),
}));

describe("login page", () => {
  it("server-renders the login form as visible before hydration", async () => {
    const { default: Login } = await import("@/app/login/page");

    const html = renderToStaticMarkup(<Login />);

    expect(html).toContain("Welcome back");
    expect(html).toContain('name="email"');
    expect(html).toContain('name="password"');
    expect(html).toContain("Sign In");
    expect(html).toContain('aria-label="Show password"');
    expect(html).not.toContain('href="#"');

    const formIndex = html.indexOf("<form");
    expect(formIndex).toBeGreaterThan(-1);
    expect(html.slice(0, formIndex)).not.toMatch(/opacity:\s*0/);
  }, 10000);
});
