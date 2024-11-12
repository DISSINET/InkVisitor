const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const Dotenv = require("dotenv-webpack");
const webpack = require("webpack");

module.exports = merge(common, {
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
          console.log("123error", error);
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
    new Dotenv({
      path: "./env/.env.development",
      systemvars: true,
    }),
    new webpack.HotModuleReplacementPlugin(),
  ],

  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
  },
});
