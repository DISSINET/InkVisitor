const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const createStyledComponentsTransformer =
  require("typescript-plugin-styled-components").default;
const styledComponentsTransformer = createStyledComponentsTransformer();
const dotenv = require('dotenv');
const path = require("path");
const Dotenv = require("dotenv-webpack");

module.exports = (env) => {
  const envFile = `.env${env ? "." + env : ""}`
  dotenv.config({ path: `./env/${envFile}` });
  console.log(`Using env file: ${envFile}`);
  
  return {
    entry: "./src/index.tsx",
    module: {
      rules: [
        {
          test: /\.txt$/,
          use: "raw-loader",
        },
        {
          test: /\.m?js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
            },
          },
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.tsx?$/,
          loader: "ts-loader",
          options: {
            getCustomTransformers: () => ({
              before: [styledComponentsTransformer],
            }),
            transpileOnly: true,
          },
        },
        {
          test: /\.(png|jp(e*)g|svg|gif)$/,
          use: [
            {
              loader: "file-loader",
              options: {
                name: "images/[hash]-[name].[ext]",
              },
            },
          ],
        },
        {
          test: /\.(woff|woff2|ttf)$/,
          type: "asset/inline",
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
      modules: ["src", "node_modules"],
      alias: {
        "@shared": path.resolve(__dirname, "../shared/"),
      },
    },
    plugins: [
      new Dotenv({
        path: `./env/${envFile}`,
        systemvars: true,
      }),
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: "./public/index.html",
        favicon: "./public/favicon.ico",
        templateParameters: {
          appConfig: `<script>window.appConfig = { env: "${process.env.ENV}" };</script>`
        }
      }),
      new CopyPlugin({
        patterns: [{ from: "src/assets", to: "." }],
      }),
    ],
  };
};
