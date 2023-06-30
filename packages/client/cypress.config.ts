import dotenv from "dotenv";
dotenv.config();

import { defineConfig } from "cypress";
import webpackConfig from "./webpack.common";

export default defineConfig({
  viewportWidth: 1440,
  viewportHeight: 900,
  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
      webpackConfig,
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
      config.env = {
        ...process.env,
        ...config.env,
      };
      return config;
    },
  },

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
      config.env = {
        ...process.env,
        ...config.env,
      };
      return config;
    },
  },

  // env: {
  //   APIURL: "http://localhost:3000",
  // },
});
