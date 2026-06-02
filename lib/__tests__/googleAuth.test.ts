import { describe, expect, it } from "vitest";

import {
  NATIVE_OAUTH_REDIRECT_URI,
  pickOAuthRedirectUri,
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
