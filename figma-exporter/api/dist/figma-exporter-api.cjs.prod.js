'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var documentationObject = require('../../dist/documentation-object-1d3e4040.cjs.prod.js');
require('lodash/isEqual');
require('axios');
require('archiver');
require('chalk');
require('lodash/uniq');
require('lodash');
require('path');
require('fs-extra');



exports.createDocumentationObject = documentationObject.createDocumentationObject;
exports.generateChangelogRecord = documentationObject.generateChangelogRecord;
exports.zipAssets = documentationObject.zipAssets;
