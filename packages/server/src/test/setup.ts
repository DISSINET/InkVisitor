import { generateAccessToken } from "@common/auth";
import { adminSeed } from "./fixtures";

/**
 * Runs in every Jest worker (setupFiles), before any test module is imported.
 *
 * Mints the bearer token that supertestConfig.token (read at import time in
 * src/modules/index.ts) hands to authenticated requests. Done here rather than
 * in globalSetup because globalSetup's process.env mutations do not propagate
 * to worker processes. It is deterministic: SECRET is fixed in .env.test and
 * the admin payload is constant, so every worker mints an equivalent token that
 * validateJwt (re-fetching the seeded admin by id) accepts.
 */
if (!process.env.TEST_JWT_TOKEN) {
  process.env.TEST_JWT_TOKEN = generateAccessToken(adminSeed, 365 * 10);
}
