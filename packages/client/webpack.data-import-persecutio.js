const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const Dotenv = require("dotenv-webpack");
const webpack = require("webpack");

module.exports = merge(common('data-import-persecutio'), {
  mode: "production",
  devtool: "source-map",

  plugins: [
  ],

  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
});
