import { describe, expect, it } from "vitest";

import { shouldEnableGoogleSignIn } from "../appEnvironmentPolicy";

describe("shouldEnableGoogleSignIn", () => {
  it("enables Google sign-in in dev and Expo Go", () => {
    expect(
      shouldEnableGoogleSignIn({
        isDev: true,
        isExpoGo: false,
        platformOs: "android",
      }),
    ).toBe(true);

    expect(
      shouldEnableGoogleSignIn({
        isDev: false,
        isExpoGo: true,
        platformOs: "android",
      }),
    ).toBe(true);
  });

  it("disables Google sign-in in preview/production native builds", () => {
    expect(
      shouldEnableGoogleSignIn({
        isDev: false,
        isExpoGo: false,
        platformOs: "android",
      }),
    ).toBe(false);
  });

  it("enables Google sign-in on local web only", () => {
    expect(
      shouldEnableGoogleSignIn({
        isDev: false,
        isExpoGo: false,
        platformOs: "web",
        webHostname: "localhost",
      }),
    ).toBe(true);

    expect(
      shouldEnableGoogleSignIn({
        isDev: false,
        isExpoGo: false,
        platformOs: "web",
        webHostname: "highballers.app",
      }),
    ).toBe(false);
  });
});
