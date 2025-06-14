const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const webpack = require("webpack");

module.exports = merge(common('development'), {
  mode: "development",
  devtool: "cheap-source-map",
  devServer: {
    hot: true,
    historyApiFallback: true,
    port: 8000,
    static: {
      directory: path.resolve(__dirname, "./src/assets"),
      publicPath: "/",
    },
    client: {
      overlay: {
        runtimeErrors: (error) => {
          if (
            error.message === "ResizeObserver loop limit exceeded" ||
            error.message ===
              "ResizeObserver loop completed with undelivered notifications."
          ) {
            return false;
          }
          return true;
        },
      },
    },
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
  },
});
