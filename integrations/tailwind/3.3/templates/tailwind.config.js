const path = require("path");
const fs = require('fs');
const plugin = require('tailwindcss/plugin')
const createComponentMap = require("./components");
const theme = require("../../../../../exported/tailwind-tokens/theme.js");
const tokenFile = path.resolve("exported/tokens.json");
const tokenData = fs.readFileSync(tokenFile, "utf8");
const tokens = JSON.parse(tokenData);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./.handoff-app/integrations/tailwind/3.3/**/*.{html,js}"],
  blocklist: [],
  theme: { 
    ...theme.theme 
  },
  plugins: [
    plugin(function ({ addComponents }) {
      addComponents(createComponentMap(tokens.components));
    }),
  ],
};
