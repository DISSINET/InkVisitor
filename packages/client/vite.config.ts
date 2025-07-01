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
          manualChunks: (id) => {
            // Group all components together to avoid circular dependencies
            if (id.includes("src/components/")) {
              return "components";
            }

            // Group all pages together
            if (id.includes("src/pages/")) {
              return "pages";
            }

            // Group all hooks together
            if (id.includes("src/hooks/")) {
              return "hooks";
            }

            // Group all redux features together
            if (id.includes("src/redux/features/")) {
              return "redux-features";
            }

            // Vendor chunks
            if (id.includes("node_modules")) {
              // Split React and React-DOM for better optimization
              if (id.includes("react") && !id.includes("react-dom")) {
                return "react-core";
              }
              if (id.includes("react-dom")) {
                return "react-dom";
              }
              if (id.includes("@reduxjs") || id.includes("redux")) {
                return "redux-vendor";
              }
              if (id.includes("react-router")) {
                return "router-vendor";
              }
              if (
                id.includes("styled-components") ||
                id.includes("@react-spring")
              ) {
                return "ui-vendor";
              }
              if (id.includes("react-icons")) {
                return "icons-vendor";
              }
              if (id.includes("@tanstack/react-query")) {
                return "query-vendor";
              }
              if (id.includes("react-dnd")) {
                return "dnd-vendor";
              }
              if (
                id.includes("react-select") ||
                id.includes("react-popper") ||
                id.includes("@popperjs")
              ) {
                return "form-vendor";
              }
              if (id.includes("react-table") || id.includes("react-window")) {
                return "table-vendor";
              }
              if (id.includes("reactflow")) {
                return "flow-vendor";
              }
              if (
                id.includes("axios") ||
                id.includes("uuid") ||
                id.includes("immutability-helper")
              ) {
                return "utils-vendor";
              }
              if (
                id.includes("react-toastify") ||
                id.includes("react-spinners")
              ) {
                return "feedback-vendor";
              }
              if (
                id.includes("react-helmet") ||
                id.includes("react-json-view")
              ) {
                return "document-vendor";
              }
              if (id.includes("@inkvisitor/annotator")) {
                return "annotator-vendor";
              }

              // Default vendor chunk for other node_modules
              return "vendor";
            }
          },
        },
      },
    },
    define: {
      "process.env.ENV": JSON.stringify(env.ENV || mode),
      "process.env.ROOT_URL": JSON.stringify(env.ROOT_URL || ""),
      "process.env.APIURL": JSON.stringify(env.APIURL || ""),
      "process.env.BUILD_TIMESTAMP": JSON.stringify(
        process.env.BUILD_TIMESTAMP || ""
      ),
      global: "globalThis",
      "window.appConfig": JSON.stringify({ env: env.ENV || mode }),
    },
  };
});
