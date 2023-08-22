"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeserializeVariantPropertiesMapFromJson = exports.SerializeVariantPropertiesMapToJson = void 0;
function SerializeVariantPropertiesMapToJson(map) {
    return JSON.stringify(Array.from(map.entries()));
}
exports.SerializeVariantPropertiesMapToJson = SerializeVariantPropertiesMapToJson;
function DeserializeVariantPropertiesMapFromJson(mapStr) {
    return new Map(JSON.parse(mapStr));
}
exports.DeserializeVariantPropertiesMapFromJson = DeserializeVariantPropertiesMapFromJson;
