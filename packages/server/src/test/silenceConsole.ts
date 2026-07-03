/**
 * Jest setupFiles hook (runs once per test file, before any test module).
 *
 * The app logs freely at runtime - the dev-mode Mailer, password-reset notices,
 * the bootstrap "SECRET set to ..." line, and the error middleware which
 * console.error's every thrown error. Many suites deliberately exercise error
 * paths (invalid params, not-found, bad credentials), so that middleware output
 * is *expected* noise that otherwise buries the test report.
 *
 * Silence the console during tests so the report stays readable. Set TEST_LOG=1
 * to restore all output (e.g. when debugging a specific test) - jest still shows
 * assertion failures and stack traces regardless.
 */
if (!process.env.TEST_LOG) {
  const noop = (): void => undefined;
  // eslint-disable-next-line no-console
  console.log = noop;
  // eslint-disable-next-line no-console
  console.info = noop;
  // eslint-disable-next-line no-console
  console.debug = noop;
  // eslint-disable-next-line no-console
  console.warn = noop;
  // eslint-disable-next-line no-console
  console.error = noop;
}
