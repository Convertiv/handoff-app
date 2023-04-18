'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./figma-exporter.cjs.prod.js");
} else {
  module.exports = require("./figma-exporter.cjs.dev.js");
}
