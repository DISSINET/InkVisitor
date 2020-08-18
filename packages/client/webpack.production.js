const merge = require("webpack-merge");
const common = require("./webpack.common.js");
const dotenv = require("dotenv-webpack");

module.exports = merge(common, {
  mode: "production",
  devtool: "source-map",

  plugins: [
    new dotenv({
      path: ".env.production",
      safe: true,
      systemvars: true,
    }),
  ],
});
