const merge = require("webpack-merge");
const common = require("./webpack.common.js");
const dotenv = require("dotenv-webpack");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    hot: true,
    hotOnly: true,
    contentBase: "./build",
  },
  plugins: [
    new dotenv({
      path: ".env.development",
      safe: true,
      systemvars: true,
    }),
  ],
});
