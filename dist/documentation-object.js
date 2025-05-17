"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDocumentationObject = void 0;
const assets_1 = require("./exporters/assets");
const createDocumentationObject = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    const runner = yield handoff.getRunner();
    const localStyles = yield runner.extractLocalStyles();
    const icons = yield runner.extractAssets('Icons');
    yield (0, assets_1.writeAssets)(handoff, icons, 'icons');
    const logos = yield runner.extractAssets('Logo');
    yield (0, assets_1.writeAssets)(handoff, logos, 'logos');
    const components = yield runner.extractComponents(localStyles);
    return {
        timestamp: new Date().toISOString(),
        localStyles,
        components,
        assets: {
            icons,
            logos,
        },
    };
});
exports.createDocumentationObject = createDocumentationObject;
