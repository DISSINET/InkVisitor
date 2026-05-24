/// <reference types="vitest/config" />
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, "./env", "");

  // Ensure base path starts with a slash
  const rootUrl = env.ROOT_URL || "";
  const base = rootUrl.startsWith("/") ? rootUrl : `/${rootUrl}`;

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
    ],
    resolve: {
      alias: {
        "@shared": path.resolve(__dirname, "../shared/"),
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
      "process.env.BUILD_TIMESTAMP": JSON.stringify(
        process.env.BUILD_TIMESTAMP || ""
      ),
      global: "globalThis",
      ...(mode === "latest" ? {} : {
        "window.appConfig": JSON.stringify({ env: env.ENV || mode }),
      }),
    },
    test: {
      globals: true,
      environment: "jsdom",
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
    },
  };
});
