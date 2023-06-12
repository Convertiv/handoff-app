"use strict";
(() => {
var exports = {};
exports.id = 19;
exports.ids = [19];
exports.modules = {

/***/ 1811:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "applyEffectToCssProperties": () => (/* binding */ applyEffectToCssProperties),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   "getStaticProps": () => (/* binding */ getStaticProps)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var lodash_groupBy__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8492);
/* harmony import */ var lodash_groupBy__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(lodash_groupBy__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var lodash_upperFirst__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(5428);
/* harmony import */ var lodash_upperFirst__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(lodash_upperFirst__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _components_Icon__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(1701);
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(6517);
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(968);
/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(next_head__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _components_util__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(1403);
/* harmony import */ var _components_Header__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(1644);
/* harmony import */ var _exporters_utils__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(2562);
/* harmony import */ var _components_SideNav_Custom__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(4991);
/* harmony import */ var _components_AnchorNav__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(8494);
/* harmony import */ var react_markdown_lib_react_markdown__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(738);
/* harmony import */ var _components_Markdown_MarkdownComponents__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(458);
/* harmony import */ var rehype_raw__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(1871);
/* harmony import */ var _components_DownloadTokens__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(2556);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([rehype_raw__WEBPACK_IMPORTED_MODULE_12__, react_markdown_lib_react_markdown__WEBPACK_IMPORTED_MODULE_15__]);
([rehype_raw__WEBPACK_IMPORTED_MODULE_12__, react_markdown_lib_react_markdown__WEBPACK_IMPORTED_MODULE_15__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);

















const applyEffectToCssProperties = (effect, cssProperties)=>{
    if ((0,_exporters_utils__WEBPACK_IMPORTED_MODULE_14__/* .isShadowEffectType */ .$0)(effect.type)) {
        cssProperties.boxShadow = cssProperties.boxShadow ? `${cssProperties.boxShadow}, ${effect.value}` : effect.value;
    }
};
/**
 * This statically renders content from the markdown, creating menu and providing
 * metadata
 *
 * This is all done statically at build time
 * @param context GetStaticProps
 * @returns
 */ const getStaticProps = async ()=>{
    // Read current slug
    return {
        props: {
            ..._components_util__WEBPACK_IMPORTED_MODULE_7__/* .fetchFoundationDocPageMarkdown */ .me("docs/foundations/", "effects", `/foundations`).props,
            design: (0,_components_util__WEBPACK_IMPORTED_MODULE_7__/* .getTokens */ .lz)().design
        }
    };
};
const ColorsPage = ({ content , menu , metadata , current , css , scss , types , design  })=>{
    const effectGroups = Object.fromEntries(Object.entries(lodash_groupBy__WEBPACK_IMPORTED_MODULE_2___default()(design.effect, "group")).map(([groupKey, effects])=>{
        return [
            groupKey,
            effects.map((effectObj)=>{
                return {
                    ...effectObj
                };
            }), 
        ];
    }));
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "c-page",
        children: [
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)((next_head__WEBPACK_IMPORTED_MODULE_6___default()), {
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("title", {
                        children: metadata.metaTitle
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("meta", {
                        name: "description",
                        content: metadata.metaDescription
                    })
                ]
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_Header__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z, {
                menu: menu
            }),
            current.subSections.length > 0 && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_SideNav_Custom__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z, {
                menu: current
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("section", {
                className: "c-content",
                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "o-container-fluid",
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "c-hero",
                            children: [
                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                    children: [
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h1", {
                                            className: "c-title--extra-large",
                                            children: metadata.title
                                        }),
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                            className: "u-mb-2",
                                            children: metadata.description
                                        }),
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_DownloadTokens__WEBPACK_IMPORTED_MODULE_13__/* .DownloadTokens */ .S, {
                                            componentId: "effects",
                                            scss: scss,
                                            css: css,
                                            types: types
                                        })
                                    ]
                                }),
                                metadata.image && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_Icon__WEBPACK_IMPORTED_MODULE_4__/* ["default"] */ .Z, {
                                    name: metadata.image,
                                    className: "c-hero__img c-hero__img--small"
                                })
                            ]
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "o-row",
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                    className: "o-col-9 @md",
                                    children: Object.keys(effectGroups).map((group)=>/*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                            id: `${(0,lodash__WEBPACK_IMPORTED_MODULE_5__.lowerCase)(group)}-effects`,
                                            children: [
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                    className: "o-row",
                                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                        className: "o-col-10@md",
                                                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                            children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("h3", {
                                                                className: "u-mb-4",
                                                                children: [
                                                                    lodash_upperFirst__WEBPACK_IMPORTED_MODULE_3___default()(group),
                                                                    " Effects"
                                                                ]
                                                            })
                                                        })
                                                    })
                                                }),
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                    className: "o-row",
                                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                        className: "o-col-12@md",
                                                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                            className: "o-stack-2@md o-stack-2@lg u-mb-n-4",
                                                            children: effectGroups[group].map((effect)=>{
                                                                // initialize preview css properties
                                                                const cssProperties = {};
                                                                // apply background color
                                                                cssProperties.backgroundColor = "#FFF";
                                                                // apply effects
                                                                effect.effects.forEach((effect)=>{
                                                                    applyEffectToCssProperties(effect, cssProperties);
                                                                });
                                                                return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                    className: "c-color-preview",
                                                                    children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                        className: "c-color-preview__wrapper",
                                                                        children: [
                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                                                                className: "c-color-preview__sample",
                                                                                style: cssProperties
                                                                            }),
                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h5", {
                                                                                children: effect.name
                                                                            })
                                                                        ]
                                                                    })
                                                                }, `effect-${effect.group}-${effect.name}`);
                                                            })
                                                        })
                                                    })
                                                }),
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("hr", {})
                                            ]
                                        }, group))
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                    className: "o-col-3@xl u-visible@lg",
                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_AnchorNav__WEBPACK_IMPORTED_MODULE_10__/* ["default"] */ .Z, {
                                        groups: [
                                            Object.assign({}, ...[
                                                ...Object.keys(effectGroups).map((group)=>({
                                                        [`${group}-effects`]: `${lodash_upperFirst__WEBPACK_IMPORTED_MODULE_3___default()(group)} Effects`
                                                    }))
                                            ]), 
                                        ]
                                    })
                                })
                            ]
                        })
                    ]
                })
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_markdown_lib_react_markdown__WEBPACK_IMPORTED_MODULE_15__/* .ReactMarkdown */ .D, {
                components: _components_Markdown_MarkdownComponents__WEBPACK_IMPORTED_MODULE_11__/* .MarkdownComponents */ .r,
                rehypePlugins: [
                    rehype_raw__WEBPACK_IMPORTED_MODULE_12__["default"]
                ],
                children: content
            })
        ]
    });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ColorsPage);

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ 2562:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "$0": () => (/* binding */ isShadowEffectType)
/* harmony export */ });
/* unused harmony exports filterByNodeType, isNodeType, findChildNodeWithType, findChildNodeWithTypeAndName, getComponentNamePart, isValidVariantProperty, isExportable, isValidNodeType, isValidEffectType, isValidGradientType, normalizeNamePart */
function filterByNodeType(type) {
    return (obj)=>obj?.type === type;
}
function isNodeType(obj, type) {
    return obj?.type === type;
}
function findChildNodeWithType(node, type) {
    if (isNodeType(node, type)) {
        return node;
    }
    if (!("children" in node) || !node.children.length) {
        return null;
    }
    if (node.children) {
        for (const child of node.children){
            const foundNode = findChildNodeWithType(child, type);
            if (foundNode) {
                return foundNode;
            }
        }
    }
    return null;
}
function findChildNodeWithTypeAndName(node, type, name) {
    if (isNodeType(node, type) && node.name.toLowerCase() === name.toLowerCase()) {
        return node;
    }
    if (!("children" in node) || !node.children.length) {
        return null;
    }
    if (node.children) {
        for (const child of node.children){
            const foundNode = findChildNodeWithTypeAndName(child, type, name);
            if (foundNode) {
                return foundNode;
            }
        }
    }
    return null;
}
function getComponentNamePart(componentName, partKey) {
    return componentName.split(",").find((part)=>part.trim().startsWith(`${partKey}=`))?.split("=")[1];
}
const isValidVariantProperty = (variantProperty)=>{
    return [
        "THEME",
        "TYPE",
        "STATE",
        "ACTIVITY",
        "LAYOUT",
        "SIZE"
    ].includes(variantProperty);
};
const isExportable = (exportable)=>{
    return [
        "BACKGROUND",
        "BORDER",
        "SPACING",
        "TYPOGRAPHY",
        "FILL",
        "EFFECT",
        "OPACITY",
        "SIZE"
    ].includes(exportable);
};
const isValidNodeType = (type)=>{
    return [
        "DOCUMENT",
        "CANVAS",
        "FRAME",
        "GROUP",
        "VECTOR",
        "BOOLEAN_OPERATION",
        "STAR",
        "LINE",
        "ELLIPSE",
        "REGULAR_POLYGON",
        "RECTANGLE",
        "TEXT",
        "SLICE",
        "COMPONENT",
        "COMPONENT_SET",
        "INSTANCE"
    ].includes(type);
};
const isValidEffectType = (effect)=>{
    return isShadowEffectType(effect);
};
const isShadowEffectType = (effect)=>{
    return [
        "DROP_SHADOW",
        "INNER_SHADOW"
    ].includes(effect);
};
const isValidGradientType = (gradientType)=>{
    return [
        "GRADIENT_LINEAR",
        "GRADIENT_RADIAL"
    ].includes(gradientType);
};
const normalizeNamePart = (namePart)=>{
    return namePart.replace(/[^a-z0-9]+/gi, "-").replace(/^-/g, "").replace(/-$/g, "").toLowerCase();
};


/***/ }),

/***/ 9003:
/***/ ((module) => {

module.exports = require("classnames");

/***/ }),

/***/ 4470:
/***/ ((module) => {

module.exports = require("fs-extra");

/***/ }),

/***/ 8076:
/***/ ((module) => {

module.exports = require("gray-matter");

/***/ }),

/***/ 6517:
/***/ ((module) => {

module.exports = require("lodash");

/***/ }),

/***/ 8492:
/***/ ((module) => {

module.exports = require("lodash/groupBy");

/***/ }),

/***/ 5428:
/***/ ((module) => {

module.exports = require("lodash/upperFirst");

/***/ }),

/***/ 3280:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/app-router-context.js");

/***/ }),

/***/ 2796:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/head-manager-context.js");

/***/ }),

/***/ 4014:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/i18n/normalize-locale-path.js");

/***/ }),

/***/ 8524:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/is-plain-object.js");

/***/ }),

/***/ 8020:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/mitt.js");

/***/ }),

/***/ 4406:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/page-path/denormalize-page-path.js");

/***/ }),

/***/ 4964:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router-context.js");

/***/ }),

/***/ 1751:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/add-path-prefix.js");

/***/ }),

/***/ 6220:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/compare-states.js");

/***/ }),

/***/ 299:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/format-next-pathname-info.js");

/***/ }),

/***/ 3938:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/format-url.js");

/***/ }),

/***/ 9565:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/get-asset-path-from-route.js");

/***/ }),

/***/ 5789:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/get-next-pathname-info.js");

/***/ }),

/***/ 1428:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/is-dynamic.js");

/***/ }),

/***/ 8854:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/parse-path.js");

/***/ }),

/***/ 1292:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/parse-relative-url.js");

/***/ }),

/***/ 4567:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/path-has-prefix.js");

/***/ }),

/***/ 979:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/querystring.js");

/***/ }),

/***/ 3297:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/remove-trailing-slash.js");

/***/ }),

/***/ 6052:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/resolve-rewrites.js");

/***/ }),

/***/ 4226:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/route-matcher.js");

/***/ }),

/***/ 5052:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/route-regex.js");

/***/ }),

/***/ 9232:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/utils.js");

/***/ }),

/***/ 968:
/***/ ((module) => {

module.exports = require("next/head");

/***/ }),

/***/ 1853:
/***/ ((module) => {

module.exports = require("next/router");

/***/ }),

/***/ 580:
/***/ ((module) => {

module.exports = require("prop-types");

/***/ }),

/***/ 6689:
/***/ ((module) => {

module.exports = require("react");

/***/ }),

/***/ 3094:
/***/ ((module) => {

module.exports = require("react-scroll");

/***/ }),

/***/ 727:
/***/ ((module) => {

module.exports = require("react-syntax-highlighter");

/***/ }),

/***/ 1067:
/***/ ((module) => {

module.exports = require("react-syntax-highlighter/dist/cjs/languages/prism/bash");

/***/ }),

/***/ 6617:
/***/ ((module) => {

module.exports = require("react-syntax-highlighter/dist/cjs/languages/prism/json");

/***/ }),

/***/ 6547:
/***/ ((module) => {

module.exports = require("react-syntax-highlighter/dist/cjs/languages/prism/sass");

/***/ }),

/***/ 2261:
/***/ ((module) => {

module.exports = require("react-syntax-highlighter/dist/cjs/languages/prism/xml-doc");

/***/ }),

/***/ 5587:
/***/ ((module) => {

module.exports = require("react-syntax-highlighter/dist/cjs/languages/prism/yaml");

/***/ }),

/***/ 4794:
/***/ ((module) => {

module.exports = require("react-syntax-highlighter/dist/cjs/styles/prism");

/***/ }),

/***/ 997:
/***/ ((module) => {

module.exports = require("react/jsx-runtime");

/***/ }),

/***/ 4955:
/***/ ((module) => {

module.exports = import("comma-separated-tokens");;

/***/ }),

/***/ 9492:
/***/ ((module) => {

module.exports = import("hast-util-whitespace");;

/***/ }),

/***/ 6861:
/***/ ((module) => {

module.exports = import("property-information");;

/***/ }),

/***/ 1871:
/***/ ((module) => {

module.exports = import("rehype-raw");;

/***/ }),

/***/ 6688:
/***/ ((module) => {

module.exports = import("remark-parse");;

/***/ }),

/***/ 2509:
/***/ ((module) => {

module.exports = import("remark-rehype");;

/***/ }),

/***/ 1152:
/***/ ((module) => {

module.exports = import("space-separated-tokens");;

/***/ }),

/***/ 7785:
/***/ ((module) => {

module.exports = import("style-to-object");;

/***/ }),

/***/ 4390:
/***/ ((module) => {

module.exports = import("unified");;

/***/ }),

/***/ 6016:
/***/ ((module) => {

module.exports = import("unist-util-visit");;

/***/ }),

/***/ 6107:
/***/ ((module) => {

module.exports = import("vfile");;

/***/ }),

/***/ 7147:
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ 1017:
/***/ ((module) => {

module.exports = require("path");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [88,97,738,766,640,991,458,556,494], () => (__webpack_exec__(1811)));
module.exports = __webpack_exports__;

})();