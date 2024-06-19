import type { StorybookConfig } from "@storybook/html-webpack5";

const config: StorybookConfig = {
  stories: ["../config/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-webpack5-compiler-swc",
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@chromatic-com/storybook",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/html-webpack5",
    options: {},
  },
};
export default config;
