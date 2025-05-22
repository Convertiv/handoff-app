"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestVersionForComponent = void 0;
const semver_1 = __importDefault(require("semver"));
const getLatestVersionForComponent = (versions) => versions.sort(semver_1.default.rcompare)[0];
exports.getLatestVersionForComponent = getLatestVersionForComponent;
