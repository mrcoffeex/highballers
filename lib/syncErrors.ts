function readMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;

    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message;
    }

    if (typeof record.details === 'string' && record.details.trim()) {
      return record.details;
    }

    if (typeof record.hint === 'string' && record.hint.trim()) {
      return record.hint;
    }

    if (typeof record.error_description === 'string' && record.error_description.trim()) {
      return record.error_description;
    }

    if (typeof record.error === 'string' && record.error.trim()) {
      return record.error;
    }

    if (record.error && typeof record.error === 'object') {
      const nested = record.error as Record<string, unknown>;
      if (typeof nested.message === 'string' && nested.message.trim()) {
        return nested.message;
      }
    }
  }

  return '';
}

export function formatSyncError(error: unknown, fallback = 'Something went wrong. Try again.'): string {
  const message = readMessage(error);
  const lower = message.toLowerCase();

  if (lower.includes('visibility') || lower.includes('club_join_requests')) {
    return 'Database needs an update. Run supabase/migration-club-visibility.sql in the Supabase SQL Editor.';
  }

  if (lower.includes('does not exist') && lower.includes('relation')) {
    return 'Database schema is out of date. Run supabase/schema.sql (or migration-club-visibility.sql) in Supabase.';
  }

  if (lower.includes('row-level security')) {
    return 'Permission denied. Sign in again and make sure your profile is saved.';
  }

  if (lower.includes('foreign key') && lower.includes('profiles')) {
    return 'Complete your player profile before creating a club.';
  }

  if (lower.includes('storage') || lower.includes('club-logos')) {
    return 'Logo upload failed. Try again without a logo, or set up the club-logos storage bucket in Supabase.';
  }

  return message || fallback;
}
