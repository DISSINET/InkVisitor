import theme, { ThemeColor } from "Theme/theme";

// The server's SPA fallback injects `window.appConfig` into index.html at
// request time, so a single built image can serve any environment. That value
// wins. `process.env.ENV` is baked in at build time by vite's `define` and only
// applies when nothing was injected -- i.e. a static deploy under a non-root
// STATIC_PATH, or the dev server.
const buildTimeEnv = process.env.ENV || "default";

export const getAppEnv = (): string => window.appConfig?.env || buildTimeEnv;

export const ensureAppConfig = (): void => {
  if (!window.appConfig?.env) {
    window.appConfig = { env: buildTimeEnv };
  }
};

// Env names double as theme color keys, but an env can be deployed before its
// color exists. Fall back rather than resolving to an undefined background.
export const getHeaderColor = (): keyof ThemeColor => {
  const env = getAppEnv();
  if (env === "production") return "muni";
  return env in theme.color ? (env as keyof ThemeColor) : "black";
};
