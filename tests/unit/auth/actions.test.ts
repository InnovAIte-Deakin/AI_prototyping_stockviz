import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn((target: string) => {
  throw new Error(`REDIRECT:${target}`);
});
const createClient = vi.fn();

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));

const formData = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
};

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a login error without redirecting when Supabase rejects credentials", async () => {
    createClient.mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn(async () => ({
          error: { message: "Invalid login credentials" },
        })),
      },
    });

    const { login } = await import("@/app/auth/actions");
    await expect(
      login(formData({ email: "demo@stockviz.local", password: "bad" })),
    ).resolves.toEqual({ error: "Invalid login credentials" });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to dashboard after successful login", async () => {
    createClient.mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn(async () => ({ error: null })),
      },
    });

    const { login } = await import("@/app/auth/actions");
    await expect(
      login(formData({ email: "demo@stockviz.local", password: "ok" })),
    ).rejects.toThrow("REDIRECT:/dashboard");
  });

  it("validates reset email before calling Supabase", async () => {
    const { resetPassword } = await import("@/app/auth/actions");
    await expect(resetPassword(formData({ email: "bad-email" }))).resolves.toEqual(
      {
        error: "Please enter a valid email address.",
      },
    );
    expect(createClient).not.toHaveBeenCalled();
  });

  it("validates password confirmation before update", async () => {
    const { updatePassword } = await import("@/app/auth/actions");
    await expect(
      updatePassword(
        formData({ password: "Password123!", confirmPassword: "different" }),
      ),
    ).resolves.toEqual({ error: "Passwords do not match." });
    expect(createClient).not.toHaveBeenCalled();
  });
});
