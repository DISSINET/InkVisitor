/**
 * How many reverse-proxy hops sit between the client and this process.
 *
 * Express uses this to derive req.secure / req.ip from X-Forwarded-Proto and
 * X-Forwarded-For. Two things depend on getting it right:
 *
 *  - express-session skips Set-Cookie entirely when `cookie.secure` is true and
 *    req.secure is false, which is the case behind a TLS-terminating proxy.
 *  - express-rate-limit keys buckets by req.ip; untrusted, every client collapses
 *    onto the proxy's address and the signin limiter becomes global.
 *
 * A hop count is used rather than `true` on purpose. `true` trusts the whole
 * X-Forwarded-For chain, letting a client prepend a forged address and rotate
 * past the rate limiter. Counting from the right, only the last N entries are
 * treated as proxy-supplied, so the value must match the real topology.
 */
export function getTrustProxy(): number | false {
  const raw = process.env.TRUST_PROXY?.trim();

  if (raw === undefined || raw === "") {
    // Deployments run behind a single ingress. Locally there is no proxy, and
    // trusting a forwarded header from nothing is how spoofing starts.
    return process.env.NODE_ENV === "production" ? 1 : false;
  }

  if (raw === "false" || raw === "0") {
    return false;
  }

  const hops = Number(raw);
  if (!Number.isInteger(hops) || hops < 1) {
    throw new Error(
      `TRUST_PROXY must be a positive integer hop count, "false", or "0" (got "${raw}")`
    );
  }

  return hops;
}
