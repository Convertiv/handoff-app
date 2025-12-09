"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateComponentCacheEntry = exports.saveBuildCache = exports.pruneRemovedComponents = exports.loadBuildCache = exports.haveGlobalDepsChanged = exports.hasComponentChanged = exports.getCachePath = exports.createEmptyCache = exports.computeGlobalDepsState = exports.computeComponentFileStates = exports.checkOutputExists = exports.statesMatch = exports.directoryStatesMatch = exports.computeFileState = exports.computeDirectoryState = void 0;
// File state utilities
var file_state_1 = require("./file-state");
Object.defineProperty(exports, "computeDirectoryState", { enumerable: true, get: function () { return file_state_1.computeDirectoryState; } });
Object.defineProperty(exports, "computeFileState", { enumerable: true, get: function () { return file_state_1.computeFileState; } });
Object.defineProperty(exports, "directoryStatesMatch", { enumerable: true, get: function () { return file_state_1.directoryStatesMatch; } });
Object.defineProperty(exports, "statesMatch", { enumerable: true, get: function () { return file_state_1.statesMatch; } });
// Build cache utilities
var build_cache_1 = require("./build-cache");
Object.defineProperty(exports, "checkOutputExists", { enumerable: true, get: function () { return build_cache_1.checkOutputExists; } });
Object.defineProperty(exports, "computeComponentFileStates", { enumerable: true, get: function () { return build_cache_1.computeComponentFileStates; } });
Object.defineProperty(exports, "computeGlobalDepsState", { enumerable: true, get: function () { return build_cache_1.computeGlobalDepsState; } });
Object.defineProperty(exports, "createEmptyCache", { enumerable: true, get: function () { return build_cache_1.createEmptyCache; } });
Object.defineProperty(exports, "getCachePath", { enumerable: true, get: function () { return build_cache_1.getCachePath; } });
Object.defineProperty(exports, "hasComponentChanged", { enumerable: true, get: function () { return build_cache_1.hasComponentChanged; } });
Object.defineProperty(exports, "haveGlobalDepsChanged", { enumerable: true, get: function () { return build_cache_1.haveGlobalDepsChanged; } });
Object.defineProperty(exports, "loadBuildCache", { enumerable: true, get: function () { return build_cache_1.loadBuildCache; } });
Object.defineProperty(exports, "pruneRemovedComponents", { enumerable: true, get: function () { return build_cache_1.pruneRemovedComponents; } });
Object.defineProperty(exports, "saveBuildCache", { enumerable: true, get: function () { return build_cache_1.saveBuildCache; } });
Object.defineProperty(exports, "updateComponentCacheEntry", { enumerable: true, get: function () { return build_cache_1.updateComponentCacheEntry; } });
