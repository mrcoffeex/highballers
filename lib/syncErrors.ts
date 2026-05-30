function readMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;

    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }

    if (typeof record.details === "string" && record.details.trim()) {
      return record.details;
    }

    if (typeof record.hint === "string" && record.hint.trim()) {
      return record.hint;
    }

    if (
      typeof record.error_description === "string" &&
      record.error_description.trim()
    ) {
      return record.error_description;
    }

    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }

    if (record.error && typeof record.error === "object") {
      const nested = record.error as Record<string, unknown>;
      if (typeof nested.message === "string" && nested.message.trim()) {
        return nested.message;
      }
    }
  }

  return "";
}

export function formatSyncError(
  error: unknown,
  fallback = "Something went wrong. Try again.",
): string {
  const message = readMessage(error);
  const lower = message.toLowerCase();

  if (lower.includes("visibility") || lower.includes("club_join_requests")) {
    return "Database needs an update. Run supabase/migrations (latest timestamp files) or ./scripts/db-migrate-all.sh in the Supabase SQL Editor.";
  }

  if (lower.includes("does not exist") && lower.includes("relation")) {
    return "Database schema is out of date. Run supabase/schema.sql and supabase/migrations in order (see ./scripts/db-migrate-all.sh).";
  }

  if (lower.includes("club_bans")) {
    return "Database needs an update. Run supabase/migrations/20250110121400_club-bans.sql in the Supabase SQL Editor.";
  }

  if (lower.includes("row-level security") && lower.includes("club_chat")) {
    return "Chat is blocked by database rules. Run supabase/migrations/20250110121000_basic-chat.sql in the Supabase SQL Editor.";
  }

  if (lower.includes("row-level security")) {
    return "Only the game creator or club admin can save stats. Sign in with that account, or run supabase/migrations/20250110120600_event-stats-rls.sql in Supabase.";
  }

  if (lower.includes("foreign key") && lower.includes("profiles")) {
    return "A player on this court does not have a saved profile yet. Ask them to finish onboarding, then try again.";
  }

  if (lower.includes("cloud sync timed out")) {
    return "Save timed out. Check your connection and try again.";
  }

  if (lower.includes("not signed in")) {
    return "Sign in again to save box scores.";
  }

  if (lower.includes("storage") || lower.includes("club-logos")) {
    return "Logo upload failed. Try again without a logo, or set up the club-logos storage bucket in Supabase.";
  }

  return message || fallback;
}
