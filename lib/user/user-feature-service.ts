import {
  getPreferencesForCurrentUser,
  type UserPreferences,
} from "@/lib/user/preferences-service";
import {
  listWishlistForCurrentUser,
  type WishlistItem,
} from "@/lib/user/wishlist-service";

export type UserFeatureSnapshot = {
  preferences: UserPreferences;
  wishlist: WishlistItem[];
};

export async function getUserFeatureSnapshotForCurrentUser(): Promise<UserFeatureSnapshot> {
  const [preferences, wishlist] = await Promise.all([
    getPreferencesForCurrentUser(),
    listWishlistForCurrentUser(),
  ]);

  return { preferences, wishlist };
}
