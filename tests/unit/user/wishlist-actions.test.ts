import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
const listWishlistForCurrentUser = vi.fn();
const createWishlistItemForCurrentUser = vi.fn();
const deleteWishlistItemForCurrentUser = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/user/wishlist-service", () => ({
  createWishlistItemForCurrentUser,
  deleteWishlistItemForCurrentUser,
  listWishlistForCurrentUser,
  toWishlistItemSummary: (item: {
    id: string;
    notes: string | null;
    stock: { symbol: string };
  }) => ({
    id: item.id,
    notes: item.notes,
    symbol: item.stock.symbol,
  }),
  updateWishlistItemForCurrentUser: vi.fn(),
}));

describe("wishlist star actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists serializable wishlist summaries", async () => {
    listWishlistForCurrentUser.mockResolvedValue([
      {
        id: "wish-1",
        notes: null,
        stock: { symbol: "AAPL" },
      },
    ]);
    const { listWishlistSummariesAction } = await import("@/app/user/actions");

    const result = await listWishlistSummariesAction();

    expect(result).toEqual({
      items: [{ id: "wish-1", notes: null, symbol: "AAPL" }],
      ok: true,
    });
  });

  it("adds a symbol when it is not already saved", async () => {
    listWishlistForCurrentUser.mockResolvedValue([]);
    createWishlistItemForCurrentUser.mockResolvedValue({
      id: "wish-2",
      notes: null,
      stock: { symbol: "MSFT" },
    });
    const { toggleWishlistBySymbolAction } = await import("@/app/user/actions");

    const result = await toggleWishlistBySymbolAction(" msft ", "Microsoft");

    expect(createWishlistItemForCurrentUser).toHaveBeenCalledWith({
      name: "Microsoft",
      symbol: "MSFT",
    });
    expect(result).toMatchObject({
      item: { id: "wish-2", notes: null, symbol: "MSFT" },
      ok: true,
      saved: true,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/stock/MSFT");
  });

  it("removes a symbol when it is already saved", async () => {
    listWishlistForCurrentUser.mockResolvedValue([
      {
        id: "wish-3",
        notes: "watch",
        stock: { symbol: "TSLA" },
      },
    ]);
    const { toggleWishlistBySymbolAction } = await import("@/app/user/actions");

    const result = await toggleWishlistBySymbolAction("TSLA");

    expect(deleteWishlistItemForCurrentUser).toHaveBeenCalledWith("wish-3");
    expect(result).toMatchObject({
      item: null,
      ok: true,
      saved: false,
      symbol: "TSLA",
    });
  });
});
