import { describe, expect, it } from "vitest";

import {
  EMAIL_OTP_LENGTH,
  isValidEmailOtpCode,
  normalizeEmailOtpCode,
} from "../emailOtpCode";

describe("emailOtpCode", () => {
  it("normalizes input to digits only", () => {
    expect(normalizeEmailOtpCode("12 34-56")).toBe("123456");
    expect(normalizeEmailOtpCode("1234567890")).toBe("123456");
  });

  it("validates 6-digit codes", () => {
    expect(isValidEmailOtpCode("123456")).toBe(true);
    expect(isValidEmailOtpCode("12345")).toBe(false);
    expect(isValidEmailOtpCode("1234567")).toBe(false);
    expect(isValidEmailOtpCode("12a456")).toBe(false);
    expect(EMAIL_OTP_LENGTH).toBe(6);
  });
});
