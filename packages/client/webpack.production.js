const path = require("path");
const merge = require("webpack-merge");
const common = require("./webpack.common.js");
const Dotenv = require("dotenv-webpack");

module.exports = merge(common, {
  mode: "production",
  devtool: "source-map",

  plugins: [
    new Dotenv({
      ath: "./env/.env.prod",
      systemvars: true,
    }),
  ],

  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
});
