"use strict";
(() => {
var exports = {};
exports.id = 405;
exports.ids = [405];
exports.modules = {

/***/ 951:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({"src":"/_next/static/media/components.742be695.png","height":1250,"width":1528,"blurDataURL":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAHCAMAAAACh/xsAAAASFBMVEX+/v79/f39/fz8/Pz8/Pv7+/v7+/r6+vr5+fn4+Pj3+Pj39/f29vf29vb19fb19fX09fb09fX09PTz9PXy8vLw8fTu7/Hs7e9ZISstAAAAOklEQVR42hXBiRGAQAgDwPhEgsjhb/+dOrcLrpK2Z4Ra7nG+M8zoNAL6qmUUoXKXa4Kp1wDdFXlcyw9EwgIyF4oE5AAAAABJRU5ErkJggg==","blurWidth":8,"blurHeight":7});

/***/ }),

/***/ 4796:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   "getStaticProps": () => (/* binding */ getStaticProps)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9097);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_link__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(1853);
/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(next_router__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var react_markdown__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(3135);
/* harmony import */ var date_fns__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(4146);
/* harmony import */ var date_fns__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(date_fns__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(9003);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(classnames__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(766);
/* harmony import */ var _components_Icon__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(1701);
/* harmony import */ var assets_images_components_png__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(951);
/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(968);
/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(next_head__WEBPACK_IMPORTED_MODULE_10__);
/* harmony import */ var _components_Header__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(1644);
/* harmony import */ var _components_util__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(1403);
/* harmony import */ var _components_Markdown_MarkdownComponents__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(458);
/* harmony import */ var rehype_raw__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(1871);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([react_markdown__WEBPACK_IMPORTED_MODULE_4__, rehype_raw__WEBPACK_IMPORTED_MODULE_14__]);
([react_markdown__WEBPACK_IMPORTED_MODULE_4__, rehype_raw__WEBPACK_IMPORTED_MODULE_14__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);















const getCountLabel = (count, singular, plural)=>{
    if (count === 1) {
        return singular;
    }
    return plural;
};
/**
 * This statically renders the menu mixing markdown file links with the
 * normal menu
 *
 * This is all done statically at build time
 * @param context GetStaticProps
 * @returns
 */ const getStaticProps = async (context)=>{
    return {
        props: {
            ...(0,_components_util__WEBPACK_IMPORTED_MODULE_12__/* .fetchDocPageMarkdown */ .f2)("docs/", "index", `/`).props,
            config: (0,_config__WEBPACK_IMPORTED_MODULE_7__/* .getConfig */ .i)(),
            changelog: (0,_components_util__WEBPACK_IMPORTED_MODULE_12__/* .getChangelog */ .Sx)()
        }
    };
};
const Home = ({ content , menu , metadata , config , changelog  })=>{
    const router = (0,next_router__WEBPACK_IMPORTED_MODULE_3__.useRouter)();
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        children: [
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)((next_head__WEBPACK_IMPORTED_MODULE_10___default()), {
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
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_Header__WEBPACK_IMPORTED_MODULE_11__/* ["default"] */ .Z, {
                menu: menu
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: "o-container u-mt-6",
                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "o-row u-justify-center",
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "o-col-10",
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                    className: "u-pt-6 u-pr-9@xlg u-pl-9@xl u-pb-4 u-mb-2 u-mb-5@lg u-mt-2 u-mt-5@lg u-text-center",
                                    children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("h1", {
                                        className: "c-title--extra-large u-animation-fadein",
                                        children: [
                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("strong", {
                                                children: [
                                                    config.client,
                                                    " Design System"
                                                ]
                                            }),
                                            " for building better user experiences."
                                        ]
                                    })
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_markdown__WEBPACK_IMPORTED_MODULE_4__["default"], {
                                    components: _components_Markdown_MarkdownComponents__WEBPACK_IMPORTED_MODULE_13__/* .MarkdownComponents */ .r,
                                    rehypePlugins: [
                                        rehype_raw__WEBPACK_IMPORTED_MODULE_14__["default"]
                                    ],
                                    children: content
                                })
                            ]
                        }),
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                            className: "o-col-6@lg u-animation-fadein",
                            children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                className: "c-card c-card--blue-gradient u-pt-6@xl u-pl-7@xl u-pr-7@xl u-pb-0",
                                children: [
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h3", {
                                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("strong", {
                                            children: "Components"
                                        })
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("hr", {
                                        className: "u-mt-2 u-mb-2"
                                    }),
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("h3", {
                                        className: "u-mb-4",
                                        children: [
                                            "Building blocks for all digital ",
                                            config.client,
                                            " experiences."
                                        ]
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                        href: "/components",
                                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("a", {
                                            className: "c-button c-button--primary u-pl-5 u-mb-5 u-pr-5",
                                            children: "View Components"
                                        })
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("img", {
                                        src: assets_images_components_png__WEBPACK_IMPORTED_MODULE_9__/* ["default"].src */ .Z.src,
                                        width: assets_images_components_png__WEBPACK_IMPORTED_MODULE_9__/* ["default"].width */ .Z.width,
                                        height: assets_images_components_png__WEBPACK_IMPORTED_MODULE_9__/* ["default"].height */ .Z.height,
                                        alt: "Components"
                                    })
                                ]
                            })
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "o-col-6@lg u-animation-fadein",
                            children: [
                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                    className: "u-pt-6@xl u-pr-9@xl u-pl-9@xl u-pb-6@xl c-card c-card--grey",
                                    children: [
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h3", {
                                            children: "Design Foundations"
                                        }),
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                            children: "Sets of recommendations on how to apply design principles to provide a positive user experience."
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("ul", {
                                            className: "c-list--boxed u-pt-2",
                                            children: [
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                                        href: "/foundations/typography",
                                                        children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("a", {
                                                            className: classnames__WEBPACK_IMPORTED_MODULE_6___default()({
                                                                "is-selected": router.asPath === "/foundations/typography"
                                                            }),
                                                            children: [
                                                                "Explore Typography ",
                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_Icon__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z, {
                                                                    name: "arrow-right"
                                                                })
                                                            ]
                                                        })
                                                    })
                                                }),
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                                        href: "/foundations/colors",
                                                        children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("a", {
                                                            className: classnames__WEBPACK_IMPORTED_MODULE_6___default()({
                                                                "is-selected": router.asPath === "/foundations/colors"
                                                            }),
                                                            children: [
                                                                "Explore Colors ",
                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_Icon__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z, {
                                                                    name: "arrow-right"
                                                                })
                                                            ]
                                                        })
                                                    })
                                                }),
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                                        href: "/foundations/logo",
                                                        children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("a", {
                                                            className: classnames__WEBPACK_IMPORTED_MODULE_6___default()({
                                                                "is-selected": router.asPath === "/foundations/logo"
                                                            }),
                                                            children: [
                                                                "Explore Logos ",
                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_Icon__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z, {
                                                                    name: "arrow-right"
                                                                })
                                                            ]
                                                        })
                                                    })
                                                }),
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                                    children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("a", {
                                                        href: "/tokens.zip",
                                                        children: [
                                                            "Download All Tokens ",
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_Icon__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z, {
                                                                name: "arrow-right"
                                                            })
                                                        ]
                                                    })
                                                })
                                            ]
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                    className: "u-pt-6@xl u-pr-9@xl u-pl-9@xl u-pb-6@xl c-card c-card--grey",
                                    children: [
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h3", {
                                            children: "Latest Changes"
                                        }),
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                            children: "This is an example of description."
                                        }),
                                        changelog.map((changelogRecord, index)=>{
                                            const date = new Date(changelogRecord.timestamp);
                                            const added = {
                                                colors: (changelogRecord.design?.colors ?? []).filter((item)=>item.type === "add"),
                                                typography: (changelogRecord.design?.typography ?? []).filter((item)=>item.type === "add"),
                                                icons: (changelogRecord.assets?.icons ?? []).filter((item)=>item.type === "add"),
                                                logos: (changelogRecord.assets?.logos ?? []).filter((item)=>item.type === "add")
                                            };
                                            const changed = {
                                                colors: (changelogRecord.design?.colors ?? []).filter((item)=>item.type === "change"),
                                                typography: (changelogRecord.design?.typography ?? []).filter((item)=>item.type === "change"),
                                                icons: (changelogRecord.assets?.icons ?? []).filter((item)=>item.type === "change"),
                                                logos: (changelogRecord.assets?.logos ?? []).filter((item)=>item.type === "change")
                                            };
                                            const deleted = {
                                                colors: (changelogRecord.design?.colors ?? []).filter((item)=>item.type === "delete"),
                                                typography: (changelogRecord.design?.typography ?? []).filter((item)=>item.type === "delete"),
                                                icons: (changelogRecord.assets?.icons ?? []).filter((item)=>item.type === "delete"),
                                                logos: (changelogRecord.assets?.logos ?? []).filter((item)=>item.type === "delete")
                                            };
                                            return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react__WEBPACK_IMPORTED_MODULE_1__.Fragment, {
                                                children: [
                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("small", {
                                                        children: [
                                                            "Changes on ",
                                                            (0,date_fns__WEBPACK_IMPORTED_MODULE_5__.format)(date, "MMMM do, yyyy")
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("ul", {
                                                        className: "c-list--boxed u-pt-2",
                                                        children: [
                                                            added.colors.length > 0 && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                                                                    children: [
                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_Icon__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z, {
                                                                            name: "activity"
                                                                        }),
                                                                        " Added",
                                                                        " ",
                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("strong", {
                                                                            children: [
                                                                                added.colors.length,
                                                                                " ",
                                                                                getCountLabel(added.colors.length, "color", "colors")
                                                                            ]
                                                                        }),
                                                                        "."
                                                                    ]
                                                                })
                                                            }),
                                                            added.typography.length > 0 && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                                                                    children: [
                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_Icon__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z, {
                                                                            name: "activity"
                                                                        }),
                                                                        " Added",
                                                                        " ",
                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("strong", {
                                                                            children: [
                                                                                added.typography.length,
                                                                                " ",
                                                                                getCountLabel(added.typography.length, "typography", "typographies")
                                                                            ]
                                                                        }),
                                                                        "."
                                                                    ]
                                                                })
                                                            }),
                                                            added.icons.length > 0 && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                                                                    children: [
                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_Icon__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z, {
                                                                            name: "activity"
                                                                        }),
                                                                        " Added",
                                                                        " ",
                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("strong", {
                                                                            children: [
                                                                                added.icons.length,
                                                                                " ",
                                                                                getCountLabel(added.icons.length, "icon", "icons")
                                                                            ]
                                                                        }),
                                                                        "."
                                                                    ]
                                                                })
                                                            }),
                                                            added.logos.length > 0 && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                                                                    children: [
                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_Icon__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z, {
                                                                            name: "activity"
                                                                        }),
                                                                        " Added",
                                                                        " ",
                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("strong", {
                                                                            children: [
                                                                                added.logos.length,
                                                                                " ",
                                                                                getCountLabel(added.logos.length, "logo", "logos")
                                                                            ]
                                                                        }),
                                                                        "."
                                                                    ]
                                                                })
                                                            }),
                                                            changed.colors.length > 0 && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                                                                    children: [
                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_Icon__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z, {
                                                                            name: "sun"
                                                                        }),
                                                                        " Changed",
                                                                        " ",
                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("strong", {
                                                                            children: [
                                                                                changed.colors.length,
                                                                                " ",
                                                                                getCountLabel(changed.colors.length, "color", "colors")
                                                                            ]
                                                                        }),
                                                                        "."
                                                                    ]
                                                                })
                                                            }),
                                                            changed.typography.length > 0 && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                                                                    children: [
                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_Icon__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z, {
                                                                            name: "sun"
                                                                        }),
                                                                        " Changed",
                                                                        " ",
                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("strong", {
                                                                            children: [
                                                                                changed.typography.length,
                                                                                " ",
                                                                                getCountLabel(changed.typography.length, "typography", "typographies")
                                                                            ]
                                                                        }),
                                                                        "."
                                                                    ]
                                                                })
                                                            }),
                                                            changed.icons.length > 0 && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                                                                    children: [
                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_Icon__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z, {
                                                                            name: "sun"
                                                                        }),
                                                                        " Changed",
                                                                        " ",
                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("strong", {
                                                                            children: [
                                                                                changed.icons.length,
                                                                                " ",
                                                                                getCountLabel(changed.icons.length, "icon", "icons")
                                                                            ]
                                                                        }),
                                                                        "."
                                                                    ]
                                                                })
                                                            }),
                                                            changed.logos.length > 0 && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                                                                    children: [
                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_Icon__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z, {
                                                                            name: "sun"
                                                                        }),
                                                                        " Changed",
                                                                        " ",
                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("strong", {
                                                                            children: [
                                                                                changed.logos.length,
                                                                                " ",
                                                                                getCountLabel(changed.logos.length, "logo", "logos")
                                                                            ]
                                                                        }),
                                                                        "."
                                                                    ]
                                                                })
                                                            }),
                                                            deleted.colors.length > 0 && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                                                                    children: [
                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_Icon__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z, {
                                                                            name: "zap"
                                                                        }),
                                                                        " Removed",
                                                                        " ",
                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("strong", {
                                                                            children: [
                                                                                deleted.colors.length,
                                                                                " ",
                                                                                getCountLabel(deleted.colors.length, "color", "colors")
                                                                            ]
                                                                        }),
                                                                        "."
                                                                    ]
                                                                })
                                                            }),
                                                            deleted.typography.length > 0 && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                                                                    children: [
                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_Icon__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z, {
                                                                            name: "zap"
                                                                        }),
                                                                        " Removed",
                                                                        " ",
                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("strong", {
                                                                            children: [
                                                                                deleted.typography.length,
                                                                                " ",
                                                                                getCountLabel(deleted.typography.length, "typography", "typographies")
                                                                            ]
                                                                        }),
                                                                        "."
                                                                    ]
                                                                })
                                                            }),
                                                            deleted.icons.length > 0 && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                                                                    children: [
                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_Icon__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z, {
                                                                            name: "zap"
                                                                        }),
                                                                        " Removed",
                                                                        " ",
                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("strong", {
                                                                            children: [
                                                                                deleted.icons.length,
                                                                                " ",
                                                                                getCountLabel(deleted.icons.length, "icon", "icons")
                                                                            ]
                                                                        }),
                                                                        "."
                                                                    ]
                                                                })
                                                            }),
                                                            deleted.logos.length > 0 && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                                                                    children: [
                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_Icon__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z, {
                                                                            name: "zap"
                                                                        }),
                                                                        " Removed",
                                                                        " ",
                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("strong", {
                                                                            children: [
                                                                                deleted.logos.length,
                                                                                " ",
                                                                                getCountLabel(deleted.logos.length, "logo", "logos")
                                                                            ]
                                                                        }),
                                                                        "."
                                                                    ]
                                                                })
                                                            })
                                                        ]
                                                    })
                                                ]
                                            }, `${changelogRecord.timestamp}_${index}`);
                                        })
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
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Home);

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ 9003:
/***/ ((module) => {

module.exports = require("classnames");

/***/ }),

/***/ 4146:
/***/ ((module) => {

module.exports = require("date-fns");

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

/***/ 6689:
/***/ ((module) => {

module.exports = require("react");

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

/***/ 3135:
/***/ ((module) => {

module.exports = import("react-markdown");;

/***/ }),

/***/ 1871:
/***/ ((module) => {

module.exports = import("rehype-raw");;

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
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [88,97,766,640,458], () => (__webpack_exec__(4796)));
module.exports = __webpack_exports__;

})();