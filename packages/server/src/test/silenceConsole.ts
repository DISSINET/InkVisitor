/**
 * Jest setupFiles hook (runs once per worker, before any test module).
 *
 * The app logs freely at runtime - the dev-mode Mailer, password-reset
 * notices, the bootstrap "SECRET set to ..." line, etc. During a test run that
 * output buries the actual test report. Silence console.log/info/debug here so
 * the report stays readable; console.warn and console.error are left intact so
 * genuine problems still surface.
 *
 * Set TEST_LOG=1 to opt back in (e.g. when debugging a specific test).
 */
if (!process.env.TEST_LOG) {
  const noop = (): void => undefined;
  // eslint-disable-next-line no-console
  console.log = noop;
  // eslint-disable-next-line no-console
  console.info = noop;
  // eslint-disable-next-line no-console
  console.debug = noop;
}
