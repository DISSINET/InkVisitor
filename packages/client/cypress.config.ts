import { defineConfig } from "cypress";
import webpackConfig from "./webpack.common";

export default defineConfig({
  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
      webpackConfig,
    },
  },
});
