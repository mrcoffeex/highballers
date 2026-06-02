export const EMAIL_OTP_LENGTH = 6;

export function normalizeEmailOtpCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, EMAIL_OTP_LENGTH);
}

export function isValidEmailOtpCode(code: string): boolean {
  return new RegExp(`^\\d{${EMAIL_OTP_LENGTH}}$`).test(code);
}
