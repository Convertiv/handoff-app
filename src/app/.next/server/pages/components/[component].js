"use strict";
(() => {
var exports = {};
exports.id = 454;
exports.ids = [454];
exports.modules = {

/***/ 9430:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "Z": () => (/* binding */ components_ComponentDesignTokens)
});

// UNUSED EXPORTS: ComponentDesignTokens

// EXTERNAL MODULE: external "react/jsx-runtime"
var jsx_runtime_ = __webpack_require__(997);
// EXTERNAL MODULE: external "lodash/startCase.js"
var startCase_js_ = __webpack_require__(12);
var startCase_js_default = /*#__PURE__*/__webpack_require__.n(startCase_js_);
;// CONCATENATED MODULE: external "lodash/sortBy.js"
const sortBy_js_namespaceObject = require("lodash/sortBy.js");
var sortBy_js_default = /*#__PURE__*/__webpack_require__.n(sortBy_js_namespaceObject);
;// CONCATENATED MODULE: external "lodash/round.js"
const round_js_namespaceObject = require("lodash/round.js");
var round_js_default = /*#__PURE__*/__webpack_require__.n(round_js_namespaceObject);
// EXTERNAL MODULE: external "react"
var external_react_ = __webpack_require__(6689);
var external_react_default = /*#__PURE__*/__webpack_require__.n(external_react_);
// EXTERNAL MODULE: ./components/Icon.tsx
var Icon = __webpack_require__(1701);
;// CONCATENATED MODULE: ../transformers/scss/component.ts
Object(function webpackMissingModule() { var e = new Error("Cannot find module '../css/utils.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());
Object(function webpackMissingModule() { var e = new Error("Cannot find module '../tokenSetTransformers.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());
Object(function webpackMissingModule() { var e = new Error("Cannot find module '../utils.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());



const transformComponentsToScssTypes = (name, components, options)=>{
    const lines = [];
    const themes = Object(function webpackMissingModule() { var e = new Error("Cannot find module '../css/utils.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())(components);
    const types = Object(function webpackMissingModule() { var e = new Error("Cannot find module '../css/utils.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())(components);
    const states = Object(function webpackMissingModule() { var e = new Error("Cannot find module '../css/utils.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())(components);
    const sizes = Object(function webpackMissingModule() { var e = new Error("Cannot find module '../css/utils.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())(components);
    // Types
    if (types && types.length > 0) {
        lines.push(`$${name}-variants: ( ${types.map((type)=>`"${type}"`).join(", ")});`);
    }
    // Sizes
    if (sizes && sizes.length > 0) {
        lines.push(`$${name}-sizes: ( ${sizes.map((type)=>`"${Object(function webpackMissingModule() { var e = new Error("Cannot find module '../utils.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())("size", type, options)}"`).join(", ")} );`);
    }
    // Themes
    if (themes && themes.length > 0) {
        lines.push(`$${name}-themes: ( ${themes.map((type)=>`"${type}"`).join(", ")} );`);
    }
    // States
    if (states && states.length > 0) {
        lines.push(`$${name}-states: ( ${states.map((type)=>`"${type == "default" ? "" : type}"`).join(", ")} );`);
    }
    return lines.join("\n\n") + "\n";
};
const transformComponentTokensToScssVariables = (component, options)=>{
    let result = {};
    for(const part in component.parts){
        const tokenSets = component.parts[part];
        if (!tokenSets || tokenSets.length === 0) {
            continue;
        }
        for (const tokenSet of tokenSets){
            const transformer = Object(function webpackMissingModule() { var e = new Error("Cannot find module '../tokenSetTransformers.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())(tokenSet);
            if (!transformer) {
                continue;
            }
            result = {
                ...result,
                ...transformer("scss", component, part, tokenSet, options)
            };
        }
    }
    return result;
};

;// CONCATENATED MODULE: ./components/ComponentDesignTokens.tsx







const UndefinedAsString = String(undefined);
const FallbackState = UndefinedAsString;
const PropertyIconPathMap = {
    "border-width": "token-border-width",
    "border-radius": "token-border-radius",
    "font-family": "token-type-small",
    "padding-top": "token-spacing-vertical",
    "padding-bottom": "token-spacing-vertical",
    "padding-left": "token-spacing-horizontal",
    "padding-right": "token-spacing-horizontal",
    "text-align": "token-alignment"
};
const IsHexValue = (value)=>value.match(/^#[0-9A-F]{6}$/i);
const NormalizeValue = (value)=>{
    if (!Number.isNaN(Number(value))) {
        const numericValue = Number(value);
        if (numericValue % 1 != 0) {
            return round_js_default()(numericValue, 2).toFixed(2);
        }
    }
    const rgbaValue = value.match(/(.*?)rgba\(([0-9]+), ([0-9]+), ([0-9]+), [+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)\)/);
    if (rgbaValue && rgbaValue.length === 7) {
        return `${rgbaValue[1]}rgba(${rgbaValue[2]}, ${rgbaValue[3]}, ${rgbaValue[4]}, ${round_js_default()(Number(rgbaValue[5]), 2).toFixed(2)})`;
    }
    return value;
};
const state_sort = [
    "default",
    "hover",
    "focus",
    "active",
    "disabled"
];
const ComponentDesignTokens = ({ transformerOptions , title , designComponents , previewObject , overrides , children  })=>{
    const componentsOfType = designComponents.filter((component)=>component.type === previewObject.type && component.activity === previewObject.activity && (component.theme === "light" || !component.theme));
    if (!componentsOfType || componentsOfType.length === 0) {
        return /*#__PURE__*/ jsx_runtime_.jsx(jsx_runtime_.Fragment, {});
    }
    const statesOfType = componentsOfType.map((component)=>String(component.state)).filter((state)=>!((overrides?.states?.length ?? 0) > 0 && !overrides?.states?.includes(state))).sort((prev, next)=>{
        let l = (overrides?.states ?? state_sort).indexOf(prev) >>> 0;
        let r = (overrides?.states ?? state_sort).indexOf(next) >>> 0;
        return l !== r ? l - r : prev.localeCompare(next);
    });
    const propertiesOfType = Object.entries(transformComponentTokensToScssVariables(componentsOfType[0], transformerOptions)).map(([_, r])=>`${r.group}\\${r.property}`);
    const propertiesWithStatesOfType = propertiesOfType.reduce((prev, next)=>({
            ...prev,
            [next]: statesOfType.reduce((prev, next)=>({
                    ...prev,
                    [next]: {}
                }), {})
        }), {});
    statesOfType.forEach((state)=>{
        const componentOfState = componentsOfType.find((component)=>component.state === state || state === FallbackState && !component.state);
        Object.entries(transformComponentTokensToScssVariables(componentOfState, transformerOptions)).forEach(([l, r])=>{
            propertiesWithStatesOfType[`${r.group}\\${r.property}`][state].variable = l;
            propertiesWithStatesOfType[`${r.group}\\${r.property}`][state].value = r.value;
        });
    });
    const designTokenGroups = Array.from(new Set(propertiesOfType.map((p)=>p.split("\\")[0])).values()).reduce((prev, next)=>{
        return {
            ...prev,
            [next]: propertiesOfType.filter((prop)=>prop.startsWith(`${next}\\`)).reduce((prev, next)=>{
                return {
                    ...prev,
                    [next.split(`\\`)[1]]: propertiesWithStatesOfType[next]
                };
            }, {})
        };
    }, {});
    const hasSingleDesignTokensGroup = Object.entries(designTokenGroups).length === 1;
    const layoutLeftColWidth = statesOfType.length >= 7 ? 11 : 4 + statesOfType.length;
    const layoutRightColWidth = 12 - layoutLeftColWidth;
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
        className: "o-col-12@md c-tokens-preview u-mb-5",
        children: [
            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                id: previewObject.id,
                children: /*#__PURE__*/ jsx_runtime_.jsx("h4", {
                    children: title
                })
            }, `${previewObject.id}__title`),
            /*#__PURE__*/ jsx_runtime_.jsx("hr", {}),
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                className: "o-row",
                children: [
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                        className: `o-col-${layoutLeftColWidth}@md`,
                        children: [
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                className: "c-tokens-preview__row",
                                children: [
                                    /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                        children: /*#__PURE__*/ jsx_runtime_.jsx("strong", {
                                            children: "Property"
                                        })
                                    }),
                                    statesOfType.map((state)=>/*#__PURE__*/ jsx_runtime_.jsx("p", {
                                            children: /*#__PURE__*/ jsx_runtime_.jsx("strong", {
                                                children: state !== FallbackState ? startCase_js_default()(state) : "Value"
                                            })
                                        }, `${previewObject.type}-*-*-${state}__title`))
                                ]
                            }),
                            Object.entries(designTokenGroups).map(([group, propsWithStateMaps])=>{
                                const props = sortBy_js_default()(Object.keys(propsWithStateMaps));
                                return /*#__PURE__*/ (0,jsx_runtime_.jsxs)((external_react_default()).Fragment, {
                                    children: [
                                        !hasSingleDesignTokensGroup && /*#__PURE__*/ (0,jsx_runtime_.jsxs)(jsx_runtime_.Fragment, {
                                            children: [
                                                /*#__PURE__*/ jsx_runtime_.jsx("br", {}),
                                                /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                                    children: /*#__PURE__*/ jsx_runtime_.jsx("strong", {
                                                        children: startCase_js_default()(group.replaceAll("-", " "))
                                                    })
                                                })
                                            ]
                                        }),
                                        props.map((prop)=>{
                                            const stateMap = propsWithStateMaps[prop];
                                            return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                                className: "c-tokens-preview__row",
                                                children: [
                                                    /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                                        children: prop
                                                    }),
                                                    Object.entries(stateMap).map(([state, { variable , value  }])=>/*#__PURE__*/ jsx_runtime_.jsx(PropertyStateValue, {
                                                            property: prop,
                                                            variable: variable,
                                                            value: value
                                                        }, `${previewObject.type}-${variable}-${state}`))
                                                ]
                                            }, `${previewObject.type}-${group}-${prop}-row`);
                                        })
                                    ]
                                }, `${previewObject.type}-${group}`);
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("div", {
                        className: `o-col-${layoutRightColWidth}@md`,
                        children: /*#__PURE__*/ jsx_runtime_.jsx("div", {
                            id: previewObject.id,
                            className: "c-component-preview--sticky",
                            children: /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                className: "c-component-preview",
                                children: children
                            })
                        }, `${previewObject.id}`)
                    })
                ]
            })
        ]
    }, `${previewObject.type}`);
};
const PropertyStateValue = ({ property , variable , value  })=>{
    const [tooltip, setTooltip] = external_react_default().useState(variable);
    (0,external_react_.useEffect)(()=>{
        if (tooltip !== variable) {
            const tooltipResetTimer = setTimeout(()=>setTooltip(variable), 2000);
            return ()=>clearTimeout(tooltipResetTimer);
        }
    }, [
        tooltip,
        variable
    ]);
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
        className: "c-token-preview c-tooltip",
        "data-tooltip": tooltip,
        onClick: (e)=>{
            e.preventDefault();
            if (window) {
                navigator.clipboard.writeText(variable);
                setTooltip("Copied to clipboard!");
            }
        },
        children: [
            IsHexValue(value) && /*#__PURE__*/ jsx_runtime_.jsx("div", {
                className: "c-token-preview__color",
                children: /*#__PURE__*/ jsx_runtime_.jsx("span", {
                    style: {
                        backgroundColor: value
                    }
                })
            }),
            /*#__PURE__*/ jsx_runtime_.jsx(PropertyIcon, {
                name: property
            }),
            /*#__PURE__*/ jsx_runtime_.jsx("p", {
                children: NormalizeValue(value)
            })
        ]
    });
};
const PropertyIcon = ({ name  })=>{
    const icon = PropertyIconPathMap[name];
    return icon !== undefined ? /*#__PURE__*/ jsx_runtime_.jsx(Icon/* default */.Z, {
        name: icon,
        className: ""
    }) : /*#__PURE__*/ jsx_runtime_.jsx(jsx_runtime_.Fragment, {});
};
/* harmony default export */ const components_ComponentDesignTokens = (ComponentDesignTokens);


/***/ }),

/***/ 6690:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "P": () => (/* binding */ CodeHighlight)
});

// EXTERNAL MODULE: external "react/jsx-runtime"
var jsx_runtime_ = __webpack_require__(997);
// EXTERNAL MODULE: external "react-syntax-highlighter"
var external_react_syntax_highlighter_ = __webpack_require__(727);
// EXTERNAL MODULE: external "react-syntax-highlighter/dist/cjs/styles/prism"
var prism_ = __webpack_require__(4794);
// EXTERNAL MODULE: external "react-syntax-highlighter/dist/cjs/languages/prism/xml-doc"
var xml_doc_ = __webpack_require__(2261);
var xml_doc_default = /*#__PURE__*/__webpack_require__.n(xml_doc_);
// EXTERNAL MODULE: external "react"
var external_react_ = __webpack_require__(6689);
// EXTERNAL MODULE: ./components/Icon.tsx
var Icon = __webpack_require__(1701);
;// CONCATENATED MODULE: ./components/CopyCode.tsx



const CopyCode = ({ code  })=>{
    const [copy, setCopy] = external_react_.useState("Copy code to clipboard");
    return /*#__PURE__*/ jsx_runtime_.jsx("a", {
        href: "#",
        className: "c-code-block__button c-tooltip",
        "data-tooltip": copy,
        "data-copy-state": "copy",
        onMouseEnter: (e)=>setCopy("Copy code to clipboard"),
        onClick: (e)=>{
            e.preventDefault();
            if (window) {
                navigator.clipboard.writeText(code);
                setCopy("Copied");
            }
        },
        children: /*#__PURE__*/ jsx_runtime_.jsx(Icon/* default */.Z, {
            name: "copy"
        })
    });
};
/* harmony default export */ const components_CopyCode = (CopyCode);

;// CONCATENATED MODULE: ./components/Markdown/CodeHighlight.tsx





external_react_syntax_highlighter_.PrismLight.registerLanguage("html", (xml_doc_default()));
/**
 * Highlight code for preview elements
 * @param param0
 * @returns ReactElement
 */ const CodeHighlight = ({ data  })=>{
    if (data) {
        return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
            className: "c-code-block",
            children: [
                /*#__PURE__*/ jsx_runtime_.jsx(external_react_syntax_highlighter_.PrismLight, {
                    // @ts-ignore
                    style: prism_.oneLight,
                    language: "html",
                    PreTag: "div",
                    showLineNumbers: true,
                    wrapLines: true,
                    useInlineStyles: true,
                    children: data.code
                }),
                /*#__PURE__*/ jsx_runtime_.jsx(components_CopyCode, {
                    code: data.code
                })
            ]
        });
    } else {
        return /*#__PURE__*/ jsx_runtime_.jsx(jsx_runtime_.Fragment, {});
    }
};


/***/ }),

/***/ 8461:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   "getComponentPreviewTitle": () => (/* binding */ getComponentPreviewTitle),
/* harmony export */   "getReducedComponentModel": () => (/* binding */ getReducedComponentModel),
/* harmony export */   "getStaticPaths": () => (/* binding */ getStaticPaths),
/* harmony export */   "getStaticProps": () => (/* binding */ getStaticProps)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var iframe_resizer_react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7798);
/* harmony import */ var iframe_resizer_react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(iframe_resizer_react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _components_util__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(1403);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(766);
/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(968);
/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(next_head__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _components_Header__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(1644);
/* harmony import */ var _components_SideNav_Custom__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(4991);
/* harmony import */ var _components_AnchorNav__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(8494);
/* harmony import */ var _components_Icon__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(1701);
/* harmony import */ var _types_tabs__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(6136);
/* harmony import */ var lodash_startCase_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(12);
/* harmony import */ var lodash_startCase_js__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(lodash_startCase_js__WEBPACK_IMPORTED_MODULE_11__);
/* harmony import */ var _components_Markdown_CodeHighlight__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(6690);
/* harmony import */ var react_markdown_lib_react_markdown__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(738);
/* harmony import */ var rehype_raw__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(1871);
/* harmony import */ var _components_DownloadTokens__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(2556);
/* harmony import */ var _components_ComponentDesignTokens__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(9430);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(2606);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([rehype_raw__WEBPACK_IMPORTED_MODULE_13__, react_markdown_lib_react_markdown__WEBPACK_IMPORTED_MODULE_17__]);
([rehype_raw__WEBPACK_IMPORTED_MODULE_13__, react_markdown_lib_react_markdown__WEBPACK_IMPORTED_MODULE_17__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);



















/**
 * Render all index pages
 * @returns
 */ async function getStaticPaths() {
    return {
        paths: (0,_components_util__WEBPACK_IMPORTED_MODULE_3__/* .fetchExportables */ .Q_)().map((exportable)=>({
                params: {
                    component: exportable.id
                }
            })),
        fallback: false
    };
}
/**
 * This statically renders content from the markdown, creating menu and providing
 * metadata
 *
 * This is all done statically at build time
 * @param context GetStaticProps
 * @returns
 */ const getStaticProps = async (context)=>{
    const { component  } = context.params;
    const componentSlug = (0,_components_util__WEBPACK_IMPORTED_MODULE_3__/* .reduceSlugToString */ .Vh)(component);
    return {
        props: {
            ...(0,_components_util__WEBPACK_IMPORTED_MODULE_3__/* .fetchCompDocPageMarkdown */ .rK)("docs/components/", componentSlug, `/components`).props,
            config: (0,_config__WEBPACK_IMPORTED_MODULE_4__/* .getConfig */ .i)(),
            exportable: (0,_components_util__WEBPACK_IMPORTED_MODULE_3__/* .fetchExportable */ .WW)(componentSlug),
            components: (0,_components_util__WEBPACK_IMPORTED_MODULE_3__/* .getTokens */ .lz)().components[componentSlug],
            previews: (0,_components_util__WEBPACK_IMPORTED_MODULE_3__/* .getPreview */ .Qe)().components[componentSlug],
            component
        }
    };
};
const GenericComponentPage = ({ content , menu , metadata , current , component , exportable , scss , css , types , components , previews , config  })=>{
    const [activeTab, setActiveTab] = react__WEBPACK_IMPORTED_MODULE_1__.useState(_types_tabs__WEBPACK_IMPORTED_MODULE_10__/* .ComponentTab.Overview */ .W.Overview);
    const designComponents = components.filter((component)=>component.componentType === "design");
    const overviewTabComponents = getComponentsAsComponentPreviews("overview", exportable, components, previews, config.component_sort);
    const designTokensTabComponents = getComponentsAsComponentPreviews("designTokens", exportable, components, previews, config.component_sort);
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "c-page",
        children: [
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)((next_head__WEBPACK_IMPORTED_MODULE_5___default()), {
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
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_Header__WEBPACK_IMPORTED_MODULE_6__/* ["default"] */ .Z, {
                menu: menu
            }),
            current.subSections.length > 0 && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_SideNav_Custom__WEBPACK_IMPORTED_MODULE_7__/* ["default"] */ .Z, {
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
                                            children: metadata.title ?? component
                                        }),
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                            children: metadata.description
                                        })
                                    ]
                                }),
                                metadata.image && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_Icon__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z, {
                                    name: metadata.image,
                                    className: "c-hero__img"
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                    className: "c-tabs",
                                    children: [
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("button", {
                                            className: `c-tabs__item ${activeTab === _types_tabs__WEBPACK_IMPORTED_MODULE_10__/* .ComponentTab.Overview */ .W.Overview ? "is-selected" : ""}`,
                                            onClick: ()=>setActiveTab(_types_tabs__WEBPACK_IMPORTED_MODULE_10__/* .ComponentTab.Overview */ .W.Overview),
                                            children: "Overview"
                                        }),
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("button", {
                                            className: `c-tabs__item ${activeTab === _types_tabs__WEBPACK_IMPORTED_MODULE_10__/* .ComponentTab.DesignTokens */ .W.DesignTokens ? "is-selected" : ""}`,
                                            onClick: ()=>setActiveTab(_types_tabs__WEBPACK_IMPORTED_MODULE_10__/* .ComponentTab.DesignTokens */ .W.DesignTokens),
                                            children: "Tokens"
                                        })
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "o-row",
                            children: [
                                activeTab == _types_tabs__WEBPACK_IMPORTED_MODULE_10__/* .ComponentTab.Overview */ .W.Overview && /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
                                    children: [
                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                            className: "o-col-9@xl",
                                            children: [
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(OverviewComponentPreview, {
                                                    components: overviewTabComponents
                                                }),
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                    id: "guidelines",
                                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(OverviewComponentGuidlines, {
                                                        content: content
                                                    })
                                                }),
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                    id: "classes",
                                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(OverviewComponentClasses, {
                                                        components: overviewTabComponents
                                                    })
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                            className: "o-col-3@xl u-visible@lg",
                                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_AnchorNav__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z, {
                                                groups: [
                                                    Object.assign({}, ...[
                                                        ...overviewTabComponents.map((obj)=>({
                                                                [obj.component.id]: getComponentPreviewTitle(obj.component)
                                                            }))
                                                    ]),
                                                    {
                                                        guidelines: "Component Guidelines"
                                                    },
                                                    {
                                                        classes: "Classes"
                                                    }, 
                                                ]
                                            })
                                        })
                                    ]
                                }),
                                activeTab == _types_tabs__WEBPACK_IMPORTED_MODULE_10__/* .ComponentTab.DesignTokens */ .W.DesignTokens && /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
                                    children: [
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                            className: "o-col-12@md u-mb-3 u-mt-4- u-flex u-justify-end ",
                                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_DownloadTokens__WEBPACK_IMPORTED_MODULE_14__/* .DownloadTokens */ .S, {
                                                componentId: component,
                                                scss: scss,
                                                css: css,
                                                types: types
                                            })
                                        }),
                                        designTokensTabComponents.map((previewableComponent)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ComponentDesignTokens__WEBPACK_IMPORTED_MODULE_15__/* ["default"] */ .Z, {
                                                title: getComponentPreviewTitle(previewableComponent.component),
                                                previewObject: previewableComponent.component,
                                                transformerOptions: exportable.options.transformer,
                                                designComponents: designComponents,
                                                overrides: previewableComponent.overrides,
                                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(ComponentDisplay, {
                                                    component: previewableComponent.preview
                                                })
                                            }, previewableComponent.component.id))
                                    ]
                                })
                            ]
                        })
                    ]
                })
            })
        ]
    });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (GenericComponentPage);
const getComponentsAsComponentPreviews = (tab, exportable, components, previews, sort)=>{
    if (!(tab in (exportable.options.demo.tabs ?? {}))) return [];
    const tabFilters = exportable.options.demo.tabs[tab] ?? {};
    const tabComponents = components.filter((component)=>{
        if (component.componentType === "design" && component.theme !== undefined) {
            return component.theme === "light";
        }
        return true;
    }).map((component)=>{
        if (!(component.componentType in tabFilters)) {
            return null;
        }
        const reducedComponentModel = getReducedComponentModel(component);
        if (tabFilters[component.componentType] === null) {
            return null;
        }
        let overrides = undefined;
        const filterProps = Object.keys(tabFilters[component.componentType]);
        for (const filterProp of filterProps){
            if (filterProp in reducedComponentModel) {
                const filterValue = tabFilters[component.componentType][filterProp];
                if (typeof filterValue === "object" && filterValue !== null) {
                    if (Array.isArray(filterValue)) {
                        // Filter value is a array so we check if the value of the respective component property
                        // is contained in the filter value array
                        if (!filterValue.includes(reducedComponentModel[filterProp])) {
                            // Filter value array does not contain the value of the respective component property
                            // Since component should not be displayed we return null value
                            return null;
                        }
                    } else {
                        // Filter value is a object so we check if the value of the respective component property
                        // is contained within the array of object keys
                        if (!Object.keys(filterValue).includes(reducedComponentModel[filterProp])) {
                            // Filter value object keys do not contain the value of the respective component property
                            // Since component should not be displayed we return null value
                            return null;
                        } else {
                            // Filter value object keys do contain the value of the respective component property
                            // We will store the property value of the filter value object for later use
                            overrides = filterValue[reducedComponentModel[filterProp]];
                        }
                    }
                } else if (typeof filterValue === "string" && reducedComponentModel[filterProp] !== filterValue) {
                    return null;
                }
            }
        }
        return {
            component: component,
            preview: previews.find((item)=>item.id === component.id),
            overrides
        };
    }).filter(_utils__WEBPACK_IMPORTED_MODULE_16__/* .filterOutNull */ .BK).sort(function(a, b) {
        const firstComponent = a.component;
        const secondComponent = b.component;
        if (!sort || sort.length === 0) {
            return 0;
        }
        let lStr = firstComponent.componentType === "design" ? firstComponent.type ?? firstComponent.state ?? firstComponent.activity ?? "" : firstComponent.layout ?? firstComponent.size ?? "";
        let rStr = secondComponent.componentType === "design" ? secondComponent.type ?? secondComponent.state ?? secondComponent.activity ?? "" : secondComponent.layout ?? secondComponent.size ?? "";
        let l = sort.indexOf(lStr) >>> 0;
        let r = sort.indexOf(rStr) >>> 0;
        return l !== r ? l - r : lStr.localeCompare(rStr);
    });
    return tabComponents;
};
const OverviewComponentPreview = ({ components  })=>{
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
        children: components.map((previewableComponent)=>{
            const component = previewableComponent.component;
            return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                id: component.id,
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h4", {
                        children: getComponentPreviewTitle(component)
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                        children: component.description
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                        className: "c-component-preview",
                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(ComponentDisplay, {
                            component: previewableComponent.preview
                        })
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_Markdown_CodeHighlight__WEBPACK_IMPORTED_MODULE_12__/* .CodeHighlight */ .P, {
                        data: previewableComponent.preview
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("hr", {})
                ]
            }, `${component.id}`);
        })
    });
};
const OverviewComponentClasses = ({ components  })=>{
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h4", {
                children: "Classes"
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                children: "Complete list of all CSS classes for the component."
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("table", {
                className: "u-mb-6",
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("thead", {
                        children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("tr", {
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("th", {
                                    children: "Name"
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("th", {
                                    children: "Class"
                                })
                            ]
                        })
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("tbody", {
                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
                            children: components.map((previewableComponent)=>{
                                const component = previewableComponent.component;
                                return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("tr", {
                                    children: [
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("td", {
                                            children: getComponentPreviewTitle(component)
                                        }),
                                        component.componentType === "design" ? /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("td", {
                                            children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("code", {
                                                children: [
                                                    component.name,
                                                    " ",
                                                    component.name,
                                                    "-",
                                                    component.type || component.state || component.activity
                                                ]
                                            })
                                        }) : /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("td", {
                                            children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("code", {
                                                children: [
                                                    component.name,
                                                    " ",
                                                    component.name,
                                                    "-",
                                                    component.size || component.layout
                                                ]
                                            })
                                        })
                                    ]
                                }, `classes-${component.id}`);
                            })
                        })
                    })
                ]
            })
        ]
    });
};
const OverviewComponentGuidlines = ({ content  })=>{
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_markdown_lib_react_markdown__WEBPACK_IMPORTED_MODULE_17__/* .ReactMarkdown */ .D, {
            rehypePlugins: [
                rehype_raw__WEBPACK_IMPORTED_MODULE_13__["default"]
            ],
            children: content
        })
    });
};
const ComponentDisplay = ({ component  })=>{
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((iframe_resizer_react__WEBPACK_IMPORTED_MODULE_2___default()), {
        style: {
            width: "1px",
            minWidth: "100%"
        },
        heightCalculationMethod: "bodyOffset",
        srcDoc: component?.preview,
        scrolling: false,
        checkOrigin: false
    });
};
const getReducedComponentModel = (component)=>{
    return {
        state: component.componentType === "design" ? component.state ?? "" : "",
        activity: component.componentType === "design" ? component.activity ?? "" : ""
    };
};
const getComponentPreviewTitle = (component)=>{
    return component.componentType === "design" ? `${lodash_startCase_js__WEBPACK_IMPORTED_MODULE_11___default()(component.type || component.state || component.activity)} ${lodash_startCase_js__WEBPACK_IMPORTED_MODULE_11___default()(component.name)}` : `${lodash_startCase_js__WEBPACK_IMPORTED_MODULE_11___default()(component.size || component.layout)} ${lodash_startCase_js__WEBPACK_IMPORTED_MODULE_11___default()(component.name)}`;
};

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ 6136:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "W": () => (/* binding */ ComponentTab)
/* harmony export */ });
var ComponentTab;
(function(ComponentTab) {
    ComponentTab[ComponentTab["Overview"] = 0] = "Overview";
    ComponentTab[ComponentTab["DesignTokens"] = 1] = "DesignTokens";
})(ComponentTab || (ComponentTab = {}));


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

/***/ 7798:
/***/ ((module) => {

module.exports = require("iframe-resizer-react");

/***/ }),

/***/ 6517:
/***/ ((module) => {

module.exports = require("lodash");

/***/ }),

/***/ 12:
/***/ ((module) => {

module.exports = require("lodash/startCase.js");

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

/***/ 2261:
/***/ ((module) => {

module.exports = require("react-syntax-highlighter/dist/cjs/languages/prism/xml-doc");

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
var __webpack_exports__ = __webpack_require__.X(0, [88,97,738,766,640,991,556,494], () => (__webpack_exec__(8461)));
module.exports = __webpack_exports__;

})();