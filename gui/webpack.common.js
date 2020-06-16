const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const FaviconsWebpackPlugin = require("favicons-webpack-plugin");
const path = require("path");

module.exports = {
  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "[name].bundle.js",
  },
  module: {
    rules: [
      { test: /\.(js)$/, use: "babel-loader", exclude: /node_modules/ },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
            },
          },
          {
            loader: "postcss-loader",
            options: {
              ident: "postcss",
              plugins: [
                require("tailwindcss"),
                require("autoprefixer"),
                require("postcss-import"),
                require("postcss-nested"),
                require("postcss-custom-properties"),
                require("postcss-preset-env")({ stage: 1 }),
              ],
            },
          },
        ],
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: "svg-url-loader",
            options: {
              limit: 10000,
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    modules: ["node_modules", "src"],
  },
  mode: "development",
  plugins: [
    new CleanWebpackPlugin(),
    new FaviconsWebpackPlugin("./public/favicon.ico"),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
  ],
};
