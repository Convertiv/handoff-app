"use strict";
exports.id = 640;
exports.ids = [640];
exports.modules = {

/***/ 1644:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(9097);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_link__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(766);
/* harmony import */ var _NavLink__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(1719);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_4__);





const config = (0,_config__WEBPACK_IMPORTED_MODULE_2__/* .getConfig */ .i)();
function Header({ menu  }) {
    const [mobile, setMobile] = react__WEBPACK_IMPORTED_MODULE_4___default().useState("");
    const toggle = ()=>{
        if (mobile === "is-active") {
            setMobile("");
        } else {
            setMobile("is-active");
        }
    };
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("header", {
                id: "site-header",
                className: "c-site-header",
                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                    className: "o-container-fluid",
                    children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "c-site-header__wrapper",
                        children: [
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                children: [
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                        className: "c-site-menu",
                                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("button", {
                                            className: `c-hamburger-icon c-hamburger-icon--slider ${mobile}`,
                                            onClick: toggle,
                                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                className: "c-hamburger-icon__box",
                                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                    className: "c-hamburger-icon__inner"
                                                })
                                            })
                                        })
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                        className: "c-site-title",
                                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_1___default()), {
                                            href: "/",
                                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("a", {
                                                className: "c-site-logo c-site-logo--basic",
                                                title: "",
                                                rel: "home",
                                                "aria-label": "logo",
                                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("img", {
                                                    src: config.logo || "/logo.svg",
                                                    alt: config.title
                                                })
                                            })
                                        })
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("nav", {
                                        className: "c-site-nav",
                                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("ul", {
                                            children: menu.map((item)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_NavLink__WEBPACK_IMPORTED_MODULE_3__/* ["default"] */ .Z, {
                                                        href: `${item.path}`,
                                                        children: item.title
                                                    })
                                                }, item.path))
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                children: // TODO: Reimpliment cmd k search
                                 false && /*#__PURE__*/ 0
                            })
                        ]
                    })
                })
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: `c-offcanvas c-offcanvas--menu ${mobile}`,
                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                    className: "c-offcanvas__inner",
                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("nav", {
                        className: "c-mobilenav",
                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("ul", {
                            className: "c-mobilenav__menu",
                            children: menu.map((item)=>/*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("li", {
                                    children: [
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_NavLink__WEBPACK_IMPORTED_MODULE_3__/* ["default"] */ .Z, {
                                            href: `${item.path}`,
                                            children: item.title
                                        }),
                                        item.subSections.length > 0 && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("ul", {
                                            className: "c-mobilenav__submenu",
                                            children: item.subSections.filter((sub)=>sub.path).map((sub)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_NavLink__WEBPACK_IMPORTED_MODULE_3__/* ["default"] */ .Z, {
                                                        href: `${sub.path}`,
                                                        children: sub.title
                                                    })
                                                }, sub.path))
                                        })
                                    ]
                                }, `mobile-${item.path}`))
                        })
                    })
                })
            })
        ]
    });
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Header);


/***/ }),

/***/ 1701:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* unused harmony export Icon */
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(9003);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(classnames__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);



const Icon = ({ name , className  })=>{
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("svg", {
        className: classnames__WEBPACK_IMPORTED_MODULE_1___default()("o-icon", className),
        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("use", {
            xmlnsXlink: "http://www.w3.org/1999/xlink",
            xlinkHref: `/assets/icons.svg#icon-${name}`
        })
    });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Icon);


/***/ }),

/***/ 1719:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9097);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_link__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(1853);
/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(next_router__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(9003);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(classnames__WEBPACK_IMPORTED_MODULE_4__);





const NavLink = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_1__.forwardRef(({ activeClassName ="is-selected" , className , children , ...props }, ref)=>{
    const router = (0,next_router__WEBPACK_IMPORTED_MODULE_3__.useRouter)();
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
        ...props,
        ref: ref,
        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("a", {
            className: classnames__WEBPACK_IMPORTED_MODULE_4___default()(className, {
                [activeClassName]: router.asPath.startsWith(props.href.toString())
            }),
            children: children
        })
    });
});
NavLink.displayName = "NavLink";
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (NavLink);


/***/ }),

/***/ 1403:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "E0": () => (/* binding */ buildL2StaticPaths),
/* harmony export */   "MD": () => (/* binding */ buildL1StaticPaths),
/* harmony export */   "NM": () => (/* binding */ fetchDocPageMetadataAndContent),
/* harmony export */   "Q_": () => (/* binding */ fetchExportables),
/* harmony export */   "Qe": () => (/* binding */ getPreview),
/* harmony export */   "Sx": () => (/* binding */ getChangelog),
/* harmony export */   "Vh": () => (/* binding */ reduceSlugToString),
/* harmony export */   "WW": () => (/* binding */ fetchExportable),
/* harmony export */   "f2": () => (/* binding */ fetchDocPageMarkdown),
/* harmony export */   "lz": () => (/* binding */ getTokens),
/* harmony export */   "me": () => (/* binding */ fetchFoundationDocPageMarkdown),
/* harmony export */   "rK": () => (/* binding */ fetchCompDocPageMarkdown)
/* harmony export */ });
/* unused harmony exports knownPaths, pluralizeComponent, staticBuildMenu, getCurrentSection, filterOutUndefined, titleString, fetchTokensString */
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(766);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(2606);
/* harmony import */ var fs_extra__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(4470);
/* harmony import */ var fs_extra__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(fs_extra__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var gray_matter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8076);
/* harmony import */ var gray_matter__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(gray_matter__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(6517);
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(1017);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_4__);






/**
 * List the default paths
 */ const knownPaths = [
    "assets",
    "assets/fonts",
    "assets/icons",
    "assets/logos",
    "foundations",
    "foundations/colors",
    "foundations/effects",
    "foundations/logos",
    "foundations/typography",
    "components",
    "changelog",
    "components/button",
    "components/alert",
    "components/modal",
    "components/pagination",
    "components/tooltip",
    "components/switch",
    "components/input",
    "components/radio",
    "components/select",
    "components/checkbox", 
];
/**
 * Get the plural name of a component
 * @param singular
 * @returns
 */ const pluralizeComponent = (singular)=>{
    return ({
        button: "buttons",
        select: "selects",
        checkbox: "checkboxes",
        radio: "radios",
        input: "inputs",
        tooltip: "tooltips",
        alert: "alerts",
        switch: "switches",
        pagination: "pagination",
        modal: "modal"
    })[singular] ?? singular;
};
/**
 * Build level 1 static path parameters
 * @returns
 */ const buildL1StaticPaths = ()=>{
    const files = fs_extra__WEBPACK_IMPORTED_MODULE_1__.readdirSync("docs");
    const paths = files.filter((fileName)=>!fs_extra__WEBPACK_IMPORTED_MODULE_1__.lstatSync(path__WEBPACK_IMPORTED_MODULE_4___default().join("docs", fileName)).isDirectory()).map((fileName)=>{
        const path = fileName.replace(".md", "");
        if (knownPaths.indexOf(path) < 0) {
            return {
                params: {
                    level1: path
                }
            };
        }
    }).filter(filterOutUndefined);
    return paths;
};
/**
 * Build static paths for level 2
 * @returns SubPathType[]
 */ const buildL2StaticPaths = ()=>{
    const files = fs_extra__WEBPACK_IMPORTED_MODULE_1__.readdirSync("docs");
    const paths = files.flatMap((fileName)=>{
        if (fs_extra__WEBPACK_IMPORTED_MODULE_1__.lstatSync(path__WEBPACK_IMPORTED_MODULE_4___default().join("docs", fileName)).isDirectory()) {
            const subFiles = fs_extra__WEBPACK_IMPORTED_MODULE_1__.readdirSync(path__WEBPACK_IMPORTED_MODULE_4___default().join("docs", fileName));
            return subFiles.flatMap((subFile)=>{
                const path = fileName.replace(".md", "");
                if (knownPaths.indexOf(path) < 0) {
                    return {
                        params: {
                            level1: fileName,
                            level2: subFile.replace(".md", "")
                        }
                    };
                }
            }).filter(filterOutUndefined);
        }
    }).filter(filterOutUndefined);
    return paths;
};
/**
 * Build the static menu for rendeirng pages
 * @returns SectionLink[]
 */ const staticBuildMenu = ()=>{
    // Contents of docs
    const files = fs_extra__WEBPACK_IMPORTED_MODULE_1__.readdirSync("docs");
    const sections = [];
    // Build path tree
    const custom = files.map((fileName)=>{
        const search = path__WEBPACK_IMPORTED_MODULE_4___default().resolve(`docs/${fileName}`);
        if (!fs_extra__WEBPACK_IMPORTED_MODULE_1__.lstatSync(search).isDirectory() && search !== path__WEBPACK_IMPORTED_MODULE_4___default().resolve("docs/index.md") && fileName.endsWith("md")) {
            const contents = fs_extra__WEBPACK_IMPORTED_MODULE_1__.readFileSync(search, "utf-8");
            const { data: metadata  } = gray_matter__WEBPACK_IMPORTED_MODULE_2___default()(contents);
            if (metadata.enabled === false) {
                return undefined;
            }
            const path1 = `/${fileName.replace(".md", "")}`;
            let subSections = [];
            if (path1 === "/components") {
                const exportables = fetchExportables();
                // Build the submenu of exportables (components)
                const groupedExportables = (0,lodash__WEBPACK_IMPORTED_MODULE_3__.groupBy)(exportables, (e)=>e.group ?? "");
                Object.keys(groupedExportables).forEach((group)=>{
                    subSections.push({
                        path: "",
                        title: group
                    });
                    groupedExportables[group].forEach((exportable)=>{
                        const exportableDocs = fetchDocPageMetadataAndContent("docs/components/", exportable.id);
                        subSections.push({
                            path: `components/${exportable.id}`,
                            title: exportableDocs.metadata.title ?? exportable.id
                        });
                    });
                });
            }
            if (metadata.menu) {
                // Build the submenu
                subSections = Object.keys(metadata.menu).map((key)=>{
                    const sub = metadata.menu[key];
                    if (sub.enabled !== false) {
                        return sub;
                    }
                }).filter(filterOutUndefined);
            }
            return {
                title: metadata.menuTitle ?? metadata.title,
                weight: metadata.weight,
                path: path1,
                subSections
            };
        }
    }).filter(filterOutUndefined);
    return sections.concat(custom).sort((a, b)=>a.weight - b.weight);
};
/**
 * Filter the menus by the current path
 * @param menu
 * @param path
 * @returns SectionLink | null
 */ const getCurrentSection = (menu, path)=>menu.filter((section)=>section.path === path)[0];
/**
 * Build a static object for rending markdown pages
 * @param path
 * @param slug
 * @returns
 */ const fetchDocPageMarkdown = (path, slug, id)=>{
    const menu = staticBuildMenu();
    const { metadata , content  } = fetchDocPageMetadataAndContent(path, slug);
    // Return props
    return {
        props: {
            metadata,
            content,
            menu,
            current: getCurrentSection(menu, `${id}`) ?? []
        }
    };
};
/**
 * Fetch Component Doc Page Markdown
 * @param path
 * @param slug
 * @param id
 * @returns
 */ const fetchCompDocPageMarkdown = (path, slug, id)=>{
    return {
        props: {
            ...fetchDocPageMarkdown(path, slug, id).props,
            scss: slug ? fetchTokensString(slug, "scss") : "",
            css: slug ? fetchTokensString(slug, "css") : "",
            types: slug ? fetchTokensString(slug, "types") : ""
        }
    };
};
/**
 * Fetch exportables id's from the JSON files in the exportables directory
 * @returns {string[]}
 */ const fetchExportables = ()=>{
    try {
        const config = (0,_config__WEBPACK_IMPORTED_MODULE_0__/* .getConfig */ .i)();
        const definitions = config.figma?.definitions;
        if (!definitions || definitions.length === 0) {
            return [];
        }
        const exportables = definitions.map((def)=>{
            const defPath = path__WEBPACK_IMPORTED_MODULE_4___default().join("exportables", `${def}.json`);
            if (!fs_extra__WEBPACK_IMPORTED_MODULE_1__.existsSync(defPath)) {
                return null;
            }
            const defBuffer = fs_extra__WEBPACK_IMPORTED_MODULE_1__.readFileSync(defPath);
            const exportable = JSON.parse(defBuffer.toString());
            const exportableOptions = {};
            (0,lodash__WEBPACK_IMPORTED_MODULE_3__.merge)(exportableOptions, config.figma?.options, exportable.options);
            exportable.options = exportableOptions;
            return exportable;
        }).filter(_utils__WEBPACK_IMPORTED_MODULE_5__/* .filterOutNull */ .BK);
        return exportables ? exportables : [];
    } catch (e) {
        return [];
    }
};
const fetchExportable = (name)=>{
    const config = (0,_config__WEBPACK_IMPORTED_MODULE_0__/* .getConfig */ .i)();
    const def = config?.figma?.definitions.filter((def)=>{
        return def.split("/").pop() === name;
    });
    if (!def || def.length === 0) {
        return null;
    }
    const defPath = path__WEBPACK_IMPORTED_MODULE_4___default().join("exportables", `${def}.json`);
    if (!fs_extra__WEBPACK_IMPORTED_MODULE_1__.existsSync(defPath)) {
        return null;
    }
    const data = fs_extra__WEBPACK_IMPORTED_MODULE_1__.readFileSync(defPath, "utf-8");
    return JSON.parse(data.toString());
};
/**
 * Fetch Component Doc Page Markdown
 * @param path
 * @param slug
 * @param id
 * @returns
 */ const fetchFoundationDocPageMarkdown = (path, slug, id)=>{
    return {
        props: {
            ...fetchDocPageMarkdown(path, slug, id).props,
            scss: slug ? fetchTokensString(pluralizeComponent(slug), "scss") : "",
            css: slug ? fetchTokensString(pluralizeComponent(slug), "css") : "",
            types: slug ? fetchTokensString(pluralizeComponent(slug), "types") : ""
        }
    };
};
const getTokens = ()=>{
    const data = fs_extra__WEBPACK_IMPORTED_MODULE_1__.readFileSync("./exported/tokens.json", "utf-8");
    return JSON.parse(data.toString());
};
const getChangelog = ()=>{
    const data = fs_extra__WEBPACK_IMPORTED_MODULE_1__.readFileSync("./exported/changelog.json", "utf-8");
    return JSON.parse(data.toString());
};
const getPreview = ()=>{
    const data = fs_extra__WEBPACK_IMPORTED_MODULE_1__.readFileSync("./exported/preview.json", "utf-8");
    return JSON.parse(data.toString());
};
/**
 * Reduce a slug which can be either an array or string, to just a string by
 * plucking the first element
 * @param slug
 * @returns
 */ const reduceSlugToString = (slug)=>{
    let prop;
    if (Array.isArray(slug)) {
        if (slug[0]) {
            prop = slug[0];
        }
    } else {
        prop = slug;
    }
    return prop;
};
/**
 * Get doc meta and content from markdown
 * @param path
 * @param slug
 * @returns
 */ const fetchDocPageMetadataAndContent = (path, slug)=>{
    if (!fs_extra__WEBPACK_IMPORTED_MODULE_1__.existsSync(`${path}${slug}.md`)) {
        return {
            metadata: {},
            content: ""
        };
    }
    const currentContents = fs_extra__WEBPACK_IMPORTED_MODULE_1__.readFileSync(`${path}${slug}.md`, "utf-8");
    const { data: metadata , content  } = gray_matter__WEBPACK_IMPORTED_MODULE_2___default()(currentContents);
    return {
        metadata,
        content
    };
};
/**
 * Filter out undefined elements
 * @param value
 * @returns
 */ const filterOutUndefined = (value)=>value !== undefined;
/**
 * Create a title string from a prefix
 * @param prefix
 * @returns
 */ const titleString = (prefix)=>{
    const config = getConfig();
    const prepend = prefix ? `${prefix} | ` : "";
    return `${prefix}${config.client} Design System`;
};
const fetchTokensString = (component, type)=>{
    let tokens = "";
    if (type === "scss" && fs_extra__WEBPACK_IMPORTED_MODULE_1__.existsSync(`./exported/tokens/sass/${component}.scss`)) {
        tokens = fs_extra__WEBPACK_IMPORTED_MODULE_1__.readFileSync(`./exported/tokens/sass/${component}.scss`).toString();
    } else if (type === "types" && fs_extra__WEBPACK_IMPORTED_MODULE_1__.existsSync(`./exported/tokens/types/${component}.scss`)) {
        tokens = fs_extra__WEBPACK_IMPORTED_MODULE_1__.readFileSync(`./exported/tokens/types/${component}.scss`).toString();
    } else if (fs_extra__WEBPACK_IMPORTED_MODULE_1__.existsSync(`./exported/tokens/css/${component}.css`)) {
        tokens = fs_extra__WEBPACK_IMPORTED_MODULE_1__.readFileSync(`./exported/tokens/css/${component}.css`).toString();
    }
    return tokens;
};


/***/ }),

/***/ 2606:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BK": () => (/* binding */ filterOutNull)
/* harmony export */ });
/* unused harmony exports slugify, filterOutUndefined */
/**
 * Generate slug from string
 * @param str
 * @returns
 */ const slugify = (str)=>str.toLowerCase().trim().replace(/[^\w\s-]/g, "-").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
/**
 *  Filters out null values
 * @param value
 * @returns
 */ const filterOutNull = (value)=>value !== null;
/**
 * Filters out undefined vars
 * @param value
 * @returns
 */ const filterOutUndefined = (value)=>value !== undefined;


/***/ })

};
;