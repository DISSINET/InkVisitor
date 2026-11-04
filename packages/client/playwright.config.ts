import { defineConfig } from "@playwright/test";
import path from "path";

// Frontend smoke suite: boots the API on the smoke database (see
// packages/server/src/scripts/smoke-server.ts) and vite with the API url, then
// drives chromium through the screens that need a working storage backend.
// DB_ADAPTER=postgres in the environment runs the same suite on PostgreSQL.
const API_PORT = 3301;
const CLIENT_PORT = 8301;
export const OWNER_STATE = path.join(__dirname, "e2e", ".auth", "owner.json");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://127.0.0.1:${CLIENT_PORT}`,
    browserName: "chromium",
    viewport: { width: 1600, height: 900 },
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      testMatch: /.*\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: OWNER_STATE },
    },
  ],
  webServer: [
    {
      command: "pnpm -C ../server smoke:server",
      url: `http://127.0.0.1:${API_PORT}/api/health`,
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      // vite binds localhost, which resolves to ::1 alone on macOS
      command: `pnpm exec vite --host 127.0.0.1 --port ${CLIENT_PORT} --strictPort`,
      url: `http://127.0.0.1:${CLIENT_PORT}/`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        BROWSER: "none",
        APIURL: `http://127.0.0.1:${API_PORT}`,
        ROOT_URL: "",
      },
    },
  ],
});
