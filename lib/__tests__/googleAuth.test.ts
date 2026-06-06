import { describe, expect, it } from "vitest";

import {
  NATIVE_OAUTH_REDIRECT_URI,
  buildRedirectRejectedMessage,
  getRedirectToFromAuthorizeUrl,
  pickOAuthRedirectUri,
  resolveOAuthRedirectUri,
} from "../oauthRedirect";

describe("pickOAuthRedirectUri", () => {
  it("uses the runtime redirect when env is unset", () => {
    expect(
      pickOAuthRedirectUri(
        undefined,
        "exp://192.168.254.118:8081/--/oauth-callback",
      ),
    ).toBe("exp://192.168.254.118:8081/--/oauth-callback");
  });

  it("uses env when it matches runtime", () => {
    const uri = "exp://192.168.254.118:8081/--/oauth-callback";
    expect(pickOAuthRedirectUri(uri, uri)).toBe(uri);
  });

  it("ignores stale env redirect URIs", () => {
    expect(
      pickOAuthRedirectUri(
        "exp://192.168.1.10:8081/--/oauth-callback",
        "exp://192.168.254.118:8081/--/oauth-callback",
      ),
    ).toBe("exp://192.168.254.118:8081/--/oauth-callback");
  });

  it("keeps native preview redirect unchanged", () => {
    expect(
      pickOAuthRedirectUri(undefined, NATIVE_OAUTH_REDIRECT_URI),
    ).toBe(NATIVE_OAUTH_REDIRECT_URI);
  });
});

describe("resolveOAuthRedirectUri", () => {
  it("uses the app scheme for preview and store native builds", () => {
    expect(
      resolveOAuthRedirectUri({
        platformOs: "android",
        appOwnership: null,
        expoGoRedirectUri: "exp://192.168.1.1:8081/--/oauth-callback",
      }),
    ).toBe(NATIVE_OAUTH_REDIRECT_URI);
  });

  it("uses the Metro redirect in Expo Go", () => {
    expect(
      resolveOAuthRedirectUri({
        platformOs: "android",
        appOwnership: "expo",
        expoGoRedirectUri: "exp://192.168.254.118:8081/--/oauth-callback",
      }),
    ).toBe("exp://192.168.254.118:8081/--/oauth-callback");
  });

  it("uses the web origin on web", () => {
    expect(
      resolveOAuthRedirectUri({
        platformOs: "web",
        appOwnership: null,
        windowOrigin: "http://localhost:8081",
        expoGoRedirectUri: "unused",
      }),
    ).toBe("http://localhost:8081/oauth-callback");
  });
});

describe("getRedirectToFromAuthorizeUrl", () => {
  it("reads redirect_to from the Supabase authorize URL", () => {
    expect(
      getRedirectToFromAuthorizeUrl(
        "https://project.supabase.co/auth/v1/authorize?provider=google&redirect_to=highballers%3A%2F%2Foauth-callback",
      ),
    ).toBe("highballers://oauth-callback");
  });
});

describe("buildRedirectRejectedMessage", () => {
  it("mentions Site URL fallback", () => {
    expect(buildRedirectRejectedMessage("highballers://oauth-callback")).toContain(
      "Site URL",
    );
  });
});
