module.exports = {
  core: {
    builder: "webpack5",
  },
  stories: ["../src/components/**/*.stories.tsx"],
  addons: [
    "@storybook/addon-actions",
    "@storybook/addon-links",
    "@dump247/storybook-state",
  ],
};
