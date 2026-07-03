import { generateAccessToken } from "@common/auth";
import { adminSeed } from "./fixtures";

/**
 * Runs in every Jest worker (setupFiles), before any test module is imported.
 *
 * Mints the bearer token that supertestConfig.token (read at import time in
 * src/modules/index.ts) hands to authenticated requests. Done here rather than
 * in globalSetup because globalSetup's process.env mutations do not propagate
 * to worker processes. Always regenerated here so a stale TEST_JWT_TOKEN in
 * env/.env.test cannot expire and break the suite ("jwt expired" / 401).
 */
process.env.TEST_JWT_TOKEN = generateAccessToken(adminSeed, 365 * 10);
