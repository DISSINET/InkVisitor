import {
  clearRedirectTarget,
  consumeRedirectTarget,
  storeRedirectTarget,
  storeRedirectTargetFromWindow,
} from "./redirectAfterLogin";

const storageKey = "default-redirect-after-login";

describe("redirectAfterLogin", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("returns the stored route with its search and hash params", () => {
    storeRedirectTarget({
      pathname: "/",
      search: "",
      hash: "#territory=T1&detail=D1&selectedDetail=D1",
    });

    expect(consumeRedirectTarget()).toBe("/#territory=T1&detail=D1&selectedDetail=D1");
  });

  it("returns null when nothing was stored", () => {
    expect(consumeRedirectTarget()).toBe(null);
  });

  it("returns the target only once", () => {
    storeRedirectTarget({ pathname: "/explorer", search: "?a=1", hash: "" });

    expect(consumeRedirectTarget()).toBe("/explorer?a=1");
    expect(consumeRedirectTarget()).toBe(null);
  });

  it("ignores the auth routes, which a logged-in user would be bounced out of", () => {
    storeRedirectTarget({ pathname: "/login", search: "", hash: "" });
    storeRedirectTarget({ pathname: "/activate", search: "?hash=abc", hash: "" });
    storeRedirectTarget({ pathname: "/password_reset", search: "?hash=abc", hash: "" });

    expect(consumeRedirectTarget()).toBe(null);
  });

  it("drops a target that would navigate off the app", () => {
    sessionStorage.setItem(storageKey, "https://evil.example.com");
    expect(consumeRedirectTarget()).toBe(null);

    sessionStorage.setItem(storageKey, "//evil.example.com");
    expect(consumeRedirectTarget()).toBe(null);
  });

  it("clears without returning", () => {
    storeRedirectTarget({ pathname: "/", search: "", hash: "#territory=T1" });
    clearRedirectTarget();

    expect(consumeRedirectTarget()).toBe(null);
  });

  it("reads the current url relative to the router basename", () => {
    process.env.ROOT_URL = "/apps/inkvisitor";
    window.history.replaceState({}, "", "/apps/inkvisitor/explorer#territory=T1");

    storeRedirectTargetFromWindow();

    expect(consumeRedirectTarget()).toBe("/explorer#territory=T1");
    process.env.ROOT_URL = "";
  });
});
