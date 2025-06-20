import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, "./env", "");

  return {
    plugins: [
      react({
        babel: {
          plugins: [
            [
              "babel-plugin-styled-components",
              {
                displayName: true,
                ssr: false,
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
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            redux: ["react-redux", "@reduxjs/toolkit", "redux"],
          },
        },
      },
    },
    define: {
      "process.env": env,
      global: "globalThis",
      "window.appConfig": JSON.stringify({ env: env.ENV || mode }),
    },
    css: {
      modules: {
        localsConvention: "camelCase",
      },
    },
  };
});
