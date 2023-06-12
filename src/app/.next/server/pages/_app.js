"use strict";
(() => {
var exports = {};
exports.id = 888;
exports.ids = [888];
exports.modules = {

/***/ 4018:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ _app)
});

// EXTERNAL MODULE: external "react/jsx-runtime"
var jsx_runtime_ = __webpack_require__(997);
// EXTERNAL MODULE: ../config.ts
var config = __webpack_require__(766);
;// CONCATENATED MODULE: ./components/Footer.tsx


const Footer_config = (0,config/* getConfig */.i)();
function Footer() {
    const date = new Date();
    return /*#__PURE__*/ jsx_runtime_.jsx("footer", {
        id: "site-footer",
        className: "c-site-footer",
        children: /*#__PURE__*/ jsx_runtime_.jsx("div", {
            className: "o-container-fluid",
            children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("p", {
                children: [
                    "Copyright ",
                    Footer_config.client,
                    ", ",
                    date.getFullYear(),
                    Footer_config.poweredBy && /*#__PURE__*/ (0,jsx_runtime_.jsxs)(jsx_runtime_.Fragment, {
                        children: [
                            " ",
                            "- Powered By",
                            " ",
                            /*#__PURE__*/ jsx_runtime_.jsx("a", {
                                href: "https://www.handoff.com/",
                                target: "_blank",
                                rel: "noreferrer",
                                children: "Handoff"
                            })
                        ]
                    })
                ]
            })
        })
    });
}
/* harmony default export */ const components_Footer = (Footer);

;// CONCATENATED MODULE: ./pages/_app.tsx



function MyApp({ Component , pageProps  }) {
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)(jsx_runtime_.Fragment, {
        children: [
            /*#__PURE__*/ jsx_runtime_.jsx(Component, {
                ...pageProps
            }),
            /*#__PURE__*/ jsx_runtime_.jsx(components_Footer, {})
        ]
    });
}
/* harmony default export */ const _app = (MyApp);


/***/ }),

/***/ 997:
/***/ ((module) => {

module.exports = require("react/jsx-runtime");

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
var __webpack_exports__ = __webpack_require__.X(0, [766], () => (__webpack_exec__(4018)));
module.exports = __webpack_exports__;

})();