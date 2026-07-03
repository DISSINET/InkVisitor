/**
 * Retry failed tests up to 2 times. Wired into the INTEGRATION project only
 * (setupFilesAfterEnv) - the unit project stays strict so a real unit flake is
 * never masked.
 *
 * The integration suite's only remaining flake is an irreducible transport
 * artifact: supertest creates + listen(0) + closes a fresh ephemeral server per
 * request, and under a serial run the OS occasionally hands a new server a port
 * a closing one is still releasing, garbling exactly one response (ECONNRESET /
 * "Parse Error: Expected HTTP/" / a missing Content-Type). Four root-cause
 * attempts (keep-alive, shared server, per-file server, supertest 7) failed to
 * remove it without bigger regressions, so we retry instead. Every *deterministic*
 * flake has been fixed, so this masks ONLY the transport artifact: a genuinely
 * broken test fails all three attempts and still reports red.
 *
 * Set TEST_NO_RETRY=1 to disable (e.g. when hunting a new flake).
 */
if (!process.env.TEST_NO_RETRY) {
  jest.retryTimes(2, { logErrorsBeforeRetry: true });
}
