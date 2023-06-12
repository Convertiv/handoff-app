"use strict";
exports.id = 766;
exports.ids = [766];
exports.modules = {

/***/ 766:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "i": () => (/* binding */ getConfig)
/* harmony export */ });
/* unused harmony export defaultConfig */
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7147);
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(fs__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1017);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_1__);


const defaultConfig = {
    dev_access_token: null,
    figma_project_id: null,
    title: "Convertiv Design System",
    client: "Convertiv",
    google_tag_manager: null,
    integration: {
        name: "bootstrap",
        version: "5.2"
    },
    favicon: "/favicon.ico",
    logo: "/logo.svg",
    poweredBy: true,
    type_sort: [
        "Heading 1",
        "Heading 2",
        "Heading 3",
        "Heading 4",
        "Heading 5",
        "Heading 6",
        "Paragraph",
        "Subheading",
        "Blockquote",
        "Input Labels",
        "Link", 
    ],
    figma: {
        options: {
            shared: {
                defaults: {
                    theme: "light",
                    state: "default",
                    type: "default",
                    activity: "",
                    layout: "",
                    size: ""
                }
            },
            transformer: {
                replace: {
                    size: {
                        small: "sm",
                        medium: "md",
                        large: "lg"
                    }
                }
            }
        },
        definitions: [
            "components/alert",
            "components/button",
            "components/modal",
            "components/tooltip",
            "components/checkbox",
            "components/input",
            "components/radio",
            "components/select",
            "components/switch", 
        ]
    },
    type_copy: "Almost before we knew it, we had left the ground.",
    color_sort: [
        "primary",
        "secondary",
        "extra",
        "system"
    ],
    component_sort: [
        "primary",
        "secondary",
        "transparent"
    ]
};
/**
 * Get the config, either from the root of the project or from the default config
 * @returns Promise<Config>
 */ const getConfig = ()=>{
    if (global.handoff && global.handoff.config) {
        return global.handoff.config;
    }
    // Check to see if there is a config in the root of the project
    let config = {}, configPath = path__WEBPACK_IMPORTED_MODULE_1___default().resolve(process.cwd(), "client-config.json");
    if (fs__WEBPACK_IMPORTED_MODULE_0___default().existsSync(configPath)) {
        const defBuffer = fs__WEBPACK_IMPORTED_MODULE_0___default().readFileSync(configPath);
        config = JSON.parse(defBuffer.toString());
    }
    return {
        ...defaultConfig,
        ...config
    };
};


/***/ })

};
;