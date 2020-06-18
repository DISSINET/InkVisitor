module.exports = {
  plugins: [
    require("postcss-import"),
    require("tailwindcss"),
    require("postcss-nested"),
    require("postcss-custom-properties"),
    require("postcss-preset-env")({ stage: 1 }),
  ],
};
