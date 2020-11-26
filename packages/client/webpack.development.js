const merge = require("webpack-merge");
const common = require("./webpack.common.js");
const Dotenv = require("dotenv-webpack");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    hot: true,
    contentBase: "./build",
    historyApiFallback: true, // react router doesnt work localy without this setting
  },
  plugins: [
    new Dotenv({
      path: "./env/.env.devel",
      safe: true,
      systemvars: true,
    }),
  ],
});
