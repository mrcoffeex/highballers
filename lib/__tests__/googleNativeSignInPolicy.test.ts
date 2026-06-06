import { describe, expect, it } from "vitest";

import {
  canUseNativeGoogleSignIn,
  isInstalledNativeApp,
} from "../googleNativeSignInPolicy";

describe("isInstalledNativeApp", () => {
  it("is true for preview/store Android builds", () => {
    expect(
      isInstalledNativeApp({
        platformOs: "android",
        appOwnership: null,
      }),
    ).toBe(true);
  });

  it("is false in Expo Go", () => {
    expect(
      isInstalledNativeApp({
        platformOs: "android",
        appOwnership: "expo",
      }),
    ).toBe(false);
  });
});

describe("canUseNativeGoogleSignIn", () => {
  it("uses native sign-in on installed builds even before env is validated", () => {
    expect(
      canUseNativeGoogleSignIn({
        platformOs: "android",
        appOwnership: null,
        webClientId: "",
      }),
    ).toBe(true);
  });

  it("disables native sign-in in Expo Go", () => {
    expect(
      canUseNativeGoogleSignIn({
        platformOs: "android",
        appOwnership: "expo",
        webClientId: "123.apps.googleusercontent.com",
      }),
    ).toBe(false);
  });

  it("disables native sign-in on web", () => {
    expect(
      canUseNativeGoogleSignIn({
        platformOs: "web",
        appOwnership: null,
        webClientId: "123.apps.googleusercontent.com",
      }),
    ).toBe(false);
  });
});
