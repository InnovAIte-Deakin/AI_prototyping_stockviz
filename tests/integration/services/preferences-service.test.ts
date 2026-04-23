import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserPreferences } from "@/lib/user/preferences";

const { requireUserFeatureContextMock } = vi.hoisted(() => ({
  requireUserFeatureContextMock: vi.fn(),
}));

vi.mock("@/lib/user/session", () => ({
  requireUserFeatureContext: requireUserFeatureContextMock,
}));

import {
  getPreferencesForCurrentUser,
  updatePreferencesForCurrentUser,
} from "@/lib/user/preferences-service";

type SupabaseError = {
  message?: string;
};

type SupabaseResult = {
  data: unknown;
  error: SupabaseError | null;
};

type ProfilesQuery = {
  eq: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

const createProfilesQuery = (result: SupabaseResult): ProfilesQuery => {
  const query = {} as ProfilesQuery;

  query.eq = vi.fn(() => query);
  query.maybeSingle = vi.fn(async () => result);
  query.select = vi.fn(() => query);
  query.update = vi.fn(() => query);

  return query;
};

describe("preferences service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and normalizes profile preferences for the current user", async () => {
    const query = createProfilesQuery({
      data: {
        preferences: {
          currency: "AUD",
          defaultTimeframe: "10Y",
          defaultWeights: {
            fundamental: "60",
            sentiment: -1,
            technical: 200,
          },
          riskProfile: "growth",
        },
      },
      error: null,
    });
    const supabase = {
      from: vi.fn(() => query),
    };
    requireUserFeatureContextMock.mockResolvedValue({
      supabase,
      user: { id: "user-1" },
    });

    await expect(getPreferencesForCurrentUser()).resolves.toEqual({
      currency: "AUD",
      defaultTimeframe: "1M",
      defaultWeights: {
        fundamental: 60,
        sentiment: 25,
        technical: 35,
      },
      riskProfile: "growth",
    });
    expect(supabase.from).toHaveBeenCalledWith("profiles");
    expect(query.select).toHaveBeenCalledWith("preferences");
    expect(query.eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("normalizes preference updates before writing through Supabase", async () => {
    const query = createProfilesQuery({
      data: {
        preferences: {
          currency: "EUR",
          defaultTimeframe: "1M",
          defaultWeights: {
            fundamental: 50,
            sentiment: 19,
            technical: 30,
          },
          riskProfile: "balanced",
        },
      },
      error: null,
    });
    const supabase = {
      from: vi.fn(() => query),
    };
    requireUserFeatureContextMock.mockResolvedValue({
      supabase,
      user: { id: "user-1" },
    });

    const preferences = {
      currency: "EUR",
      defaultTimeframe: "BAD",
      defaultWeights: {
        fundamental: 50.4,
        sentiment: 19.4,
        technical: 30.2,
      },
      riskProfile: "speculative",
    } as unknown as UserPreferences;

    await expect(updatePreferencesForCurrentUser(preferences)).resolves.toEqual(
      {
        currency: "EUR",
        defaultTimeframe: "1M",
        defaultWeights: {
          fundamental: 50,
          sentiment: 19,
          technical: 30,
        },
        riskProfile: "balanced",
      },
    );
    expect(query.update).toHaveBeenCalledWith({
      preferences: {
        currency: "EUR",
        defaultTimeframe: "1M",
        defaultWeights: {
          fundamental: 50,
          sentiment: 19,
          technical: 30,
        },
        riskProfile: "balanced",
      },
    });
    expect(query.eq).toHaveBeenCalledWith("id", "user-1");
  });
});
