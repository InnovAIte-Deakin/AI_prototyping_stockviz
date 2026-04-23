import { createClient } from "@/lib/supabase/server";

export class UserFeatureAuthError extends Error {
  constructor() {
    super("Authentication required.");
    this.name = "UserFeatureAuthError";
  }
}

export async function requireUserFeatureContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new UserFeatureAuthError();
  }

  return { supabase, user };
}
