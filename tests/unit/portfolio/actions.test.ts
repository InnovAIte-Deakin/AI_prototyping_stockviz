import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/portfolio/holdings-service", () => ({
  PortfolioAuthError: class PortfolioAuthError extends Error {},
  createHoldingForCurrentUser: vi.fn(async () => ({ id: "holding-1" })),
  deleteHoldingForCurrentUser: vi.fn(async () => undefined),
  updateHoldingForCurrentUser: vi.fn(async () => ({ id: "holding-1" })),
}));

const formData = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
};

describe("portfolio actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid create input before mutation", async () => {
    const { createHoldingAction } = await import("@/app/portfolio/actions");
    const result = await createHoldingAction(
      { status: "idle" },
      formData({ symbol: "", shares: "0", avgPrice: "-1" }),
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors?.symbol).toBe("Enter a symbol.");
    expect(result.fieldErrors?.shares).toBe(
      "Shares must be a number greater than 0.",
    );
    expect(result.fieldErrors?.avgPrice).toBe(
      "Average cost must be 0 or greater.",
    );
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("revalidates portfolio after create", async () => {
    const { createHoldingAction } = await import("@/app/portfolio/actions");
    const result = await createHoldingAction(
      { status: "idle" },
      formData({
        acquiredAt: "2026-05-07",
        avgPrice: "185.50",
        notes: "Long-term position",
        shares: "10",
        symbol: "aapl",
      }),
    );

    expect(result).toMatchObject({
      message: "Added AAPL to your portfolio.",
      status: "success",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/portfolio");
  });

  it("requires holding id before update", async () => {
    const { updateHoldingAction } = await import("@/app/portfolio/actions");
    const result = await updateHoldingAction(
      { status: "idle" },
      formData({ symbol: "AAPL", shares: "1", avgPrice: "1" }),
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors?.holdingId).toBe("Missing holding identifier.");
  });

  it("revalidates portfolio after delete", async () => {
    const { deleteHoldingAction } = await import("@/app/portfolio/actions");
    const result = await deleteHoldingAction(
      { status: "idle" },
      formData({ holdingId: "holding-1", symbol: "AAPL" }),
    );

    expect(result).toEqual({
      message: "Removed AAPL.",
      status: "success",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/portfolio");
  });
});
