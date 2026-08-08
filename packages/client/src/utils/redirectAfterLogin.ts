import { getAppEnv } from "utils/appEnv";

const storageKey = () => `${getAppEnv()}-redirect-after-login`;

// the auth screens are never a useful destination for a logged-in user - the
// route guards would bounce straight back out of them
const authPaths = ["/login", "/activate", "/password_reset"];

interface RedirectTarget {
  pathname: string;
  search: string;
  hash: string;
}

/**
 * Remembers where the user was headed before the auth guard sent them to the
 * login screen. Kept in sessionStorage rather than router state so it survives
 * a reload of the login page and the full-page redirect the 401 interceptor
 * does. Scoped to the tab, so parallel logins in two tabs do not fight.
 */
export const storeRedirectTarget = ({ pathname, search, hash }: RedirectTarget) => {
  if (authPaths.includes(pathname)) {
    return;
  }
  sessionStorage.setItem(storageKey(), `${pathname}${search}${hash}`);
};

/**
 * Same, for callers outside the router (the api 401 interceptor). window's
 * pathname carries the basename that router paths are relative to.
 */
export const storeRedirectTargetFromWindow = () => {
  // ROOT_URL may be stored with or without a leading slash, so cutting it
  // out can leave a doubled separator behind
  const pathname =
    window.location.pathname.replace(process.env.ROOT_URL || "", "").replace(/\/{2,}/g, "/") || "/";

  storeRedirectTarget({
    pathname,
    search: window.location.search,
    hash: window.location.hash,
  });
};

/**
 * Returns the remembered target once and forgets it, or null when there is
 * nothing to return to. Anything that is not an app-internal path is dropped,
 * so a poisoned storage entry cannot steer the post-login navigation off-site.
 */
export const consumeRedirectTarget = (): string | null => {
  const target = sessionStorage.getItem(storageKey());
  clearRedirectTarget();

  if (!target || !target.startsWith("/") || target.startsWith("//")) {
    return null;
  }
  return target;
};

export const clearRedirectTarget = () => sessionStorage.removeItem(storageKey());
