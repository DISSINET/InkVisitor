const path = require("path");
const merge = require("webpack-merge");
const common = require("./webpack.common.js");
const Dotenv = require("dotenv-webpack");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    hot: true,
    contentBase: "./build",
    historyApiFallback: true, //
    port: 8000,
  },
  plugins: [
    new Dotenv({
      path: "./env/.env.devel",
      systemvars: true,
    }),
  ],

  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "build"),
    publicPath: "/",
  },
});
