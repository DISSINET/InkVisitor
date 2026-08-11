/// <reference types="vitest/config" />
import fs from "fs";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => {
  // Resolved from this file rather than the working directory, which belongs to
  // whoever spelled the build command.
  const envDir = path.resolve(__dirname, "env");
  const envFile = path.join(envDir, `.env.${mode}`);
  const env = loadEnv(mode, envDir, "");

  // The deployment writes this file from a secret, and everything it carries -
  // the base path below among it - is baked into the bundle. A missing or blank
  // one produces a build that only reveals itself in the browser, asking for
  // assets at the root of a host that serves the app from a subdirectory.
  if (command === "build") {
    const envFileContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, "utf8").trim() : "";
    if (!envFileContent) {
      throw new Error(
        `No client env for mode "${mode}": ${envFile} is missing or empty. ` +
          `In CI it is written from the CLIENT_ENV_* secret for this mode; ` +
          `locally, copy env/example.env to .env.${mode}.`,
      );
    }
  }

  const appEnv = env.ENV || mode;

  // Every asset url is resolved against this, so it has to both open and close
  // with a slash for those urls to land under the deployment path. ROOT_URL may
  // be written with or without slashes at either end, and is empty for an app
  // served from the root.
  const rootUrl = (env.ROOT_URL || "").replace(/^\/+/, "").replace(/\/+$/, "");
  const base = rootUrl ? `/${rootUrl}/` : "/";

  if (command === "build") {
    console.log(`[inkvisitor] mode "${mode}" builds assets under base "${base}"`);
  }

  return {
    base: base,
    plugins: [
      react({
        babel: {
          plugins: [
            [
              "babel-plugin-styled-components",
              {
                displayName: true,
                fileName: false,
                pure: true,
              },
            ],
          ],
        },
      }),
      {
        name: "inject-app-config",
        transformIndexHtml(html) {
          return html.replace(
            "</head>",
            `    <script>window.appConfig={env:${JSON.stringify(appEnv)}};</script>\n  </head>`
          );
        },
      },
    ],
    resolve: {
      alias: {
        api: path.resolve(__dirname, "./src/api"),
        components: path.resolve(__dirname, "./src/components"),
        hooks: path.resolve(__dirname, "./src/hooks"),
        pages: path.resolve(__dirname, "./src/pages"),
        "redux/store": path.resolve(__dirname, "./src/redux/store"),
        "redux/hooks": path.resolve(__dirname, "./src/redux/hooks"),
        "redux/features": path.resolve(__dirname, "./src/redux/features"),
        Theme: path.resolve(__dirname, "./src/Theme"),
        app: path.resolve(__dirname, "./src/app"),
        "ensure-basename": path.resolve(__dirname, "./src/ensure-basename"),
        utils: path.resolve(__dirname, "./src/utils"),
        constructors: path.resolve(__dirname, "./src/constructors"),
        types: path.resolve(__dirname, "./src/types"),
        assets: path.resolve(__dirname, "./src/assets"),
      },
    },
    server: {
      port: 8000,
      open: true,
      historyApiFallback: true,
      // Dev-only proxy: makes API calls same-origin to the browser so file
      // downloads (<a download>) work without the cross-origin tab-flicker.
      // `vite build` never reads `server`, but the explicit mode check keeps
      // the intent obvious.
      proxy:
        mode === "development" && env.APIURL
          ? {
              "/api": {
                target: env.APIURL,
                changeOrigin: true,
                secure: false,
              },
            }
          : undefined,
    },
    build: {
      outDir: "dist",
      sourcemap: mode === "development",
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (
              id.includes("node_modules/react-redux") ||
              id.includes("node_modules/@reduxjs/toolkit") ||
              id.includes("node_modules/redux/")
            ) {
              return "redux";
            }
            if (
              id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/")
            ) {
              return "vendor";
            }
          },
        },
      },
    },
    define: {
      "process.env.ROOT_URL": JSON.stringify(env.ROOT_URL || ""),
      "process.env.APIURL": JSON.stringify(env.APIURL || ""),
      "process.env.ENV": JSON.stringify(appEnv),
      "process.env.BUILD_TIMESTAMP": JSON.stringify(
        process.env.BUILD_TIMESTAMP || ""
      ),
      global: "globalThis",
      // NOTE: do not `define` "window.appConfig" here. `define` is a raw token
      // substitution, so it would rewrite every read of window.appConfig into
      // the build-time literal and make the server's runtime injection
      // unreadable.
    },
    test: {
      globals: true,
      environment: "jsdom",
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
    },
  };
});
