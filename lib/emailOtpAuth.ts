import { getSupabase } from "./supabase";
import {
  EMAIL_OTP_LENGTH,
  isValidEmailOtpCode,
  normalizeEmailOtpCode,
} from "./emailOtpCode";

export { EMAIL_OTP_LENGTH, isValidEmailOtpCode, normalizeEmailOtpCode };

/**
 * Sends a numeric email OTP. Do not pass emailRedirectTo — that triggers magic-link emails.
 * Supabase Dashboard → Auth → Email Templates → Magic Link must include `{{ .Token }}`.
 */
export async function sendEmailOtpCode(email: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return "Cloud sync is not configured.";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });

  return error?.message ?? null;
}

export async function verifyEmailOtpCode(
  email: string,
  token: string,
): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return "Cloud sync is not configured.";

  const normalized = normalizeEmailOtpCode(token);
  if (!isValidEmailOtpCode(normalized)) {
    return `Enter the ${EMAIL_OTP_LENGTH}-digit code from your email.`;
  }

  const { error } = await supabase.auth.verifyOtp({
    email,
    token: normalized,
    type: "email",
  });

  return error?.message ?? null;
}
