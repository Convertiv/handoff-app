'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./figma-exporter-api.cjs.prod.js");
} else {
  module.exports = require("./figma-exporter-api.cjs.dev.js");
}
