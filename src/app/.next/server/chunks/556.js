"use strict";
exports.id = 556;
exports.ids = [556];
exports.modules = {

/***/ 2556:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "S": () => (/* binding */ DownloadTokens)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _Icon__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(1701);



const DownloadTokens = ({ componentId , css , scss , types  })=>{
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        children: [
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("a", {
                href: "data:text/plain;charset=utf-8," + encodeURIComponent(css),
                download: `${componentId}.css`,
                className: "c-button c-button--outline c-button--small",
                children: [
                    "CSS Tokens ",
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_Icon__WEBPACK_IMPORTED_MODULE_2__/* ["default"] */ .Z, {
                        name: "download"
                    })
                ]
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("a", {
                href: "data:text/plain;charset=utf-8," + encodeURIComponent(scss),
                download: `${componentId}.scss`,
                className: "c-button c-button--outline c-button--small u-ml-2",
                children: [
                    "SASS Tokens ",
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_Icon__WEBPACK_IMPORTED_MODULE_2__/* ["default"] */ .Z, {
                        name: "download"
                    })
                ]
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("a", {
                href: "data:text/plain;charset=utf-8," + encodeURIComponent(types),
                download: `${componentId}.scss`,
                className: "c-button c-button--outline c-button--small u-ml-2",
                children: [
                    "Component Types ",
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_Icon__WEBPACK_IMPORTED_MODULE_2__/* ["default"] */ .Z, {
                        name: "download"
                    })
                ]
            })
        ]
    });
};


/***/ })

};
;