"use strict";
exports.id = 458;
exports.ids = [458];
exports.modules = {

/***/ 458:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "r": () => (/* binding */ MarkdownComponents)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_syntax_highlighter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(727);
/* harmony import */ var react_syntax_highlighter__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_syntax_highlighter__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react_syntax_highlighter_dist_cjs_styles_prism__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(4794);
/* harmony import */ var react_syntax_highlighter_dist_cjs_styles_prism__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_syntax_highlighter_dist_cjs_styles_prism__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var react_syntax_highlighter_dist_cjs_languages_prism_yaml__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(5587);
/* harmony import */ var react_syntax_highlighter_dist_cjs_languages_prism_yaml__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_syntax_highlighter_dist_cjs_languages_prism_yaml__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var react_syntax_highlighter_dist_cjs_languages_prism_json__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(6617);
/* harmony import */ var react_syntax_highlighter_dist_cjs_languages_prism_json__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react_syntax_highlighter_dist_cjs_languages_prism_json__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var react_syntax_highlighter_dist_cjs_languages_prism_bash__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(1067);
/* harmony import */ var react_syntax_highlighter_dist_cjs_languages_prism_bash__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(react_syntax_highlighter_dist_cjs_languages_prism_bash__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var react_syntax_highlighter_dist_cjs_languages_prism_sass__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(6547);
/* harmony import */ var react_syntax_highlighter_dist_cjs_languages_prism_sass__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react_syntax_highlighter_dist_cjs_languages_prism_sass__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var react_syntax_highlighter_dist_cjs_languages_prism_xml_doc__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(2261);
/* harmony import */ var react_syntax_highlighter_dist_cjs_languages_prism_xml_doc__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(react_syntax_highlighter_dist_cjs_languages_prism_xml_doc__WEBPACK_IMPORTED_MODULE_8__);










react_syntax_highlighter__WEBPACK_IMPORTED_MODULE_2__.PrismLight.registerLanguage("yaml", (react_syntax_highlighter_dist_cjs_languages_prism_yaml__WEBPACK_IMPORTED_MODULE_4___default()));
react_syntax_highlighter__WEBPACK_IMPORTED_MODULE_2__.PrismLight.registerLanguage("bash", (react_syntax_highlighter_dist_cjs_languages_prism_bash__WEBPACK_IMPORTED_MODULE_6___default()));
react_syntax_highlighter__WEBPACK_IMPORTED_MODULE_2__.PrismLight.registerLanguage("json", (react_syntax_highlighter_dist_cjs_languages_prism_json__WEBPACK_IMPORTED_MODULE_5___default()));
react_syntax_highlighter__WEBPACK_IMPORTED_MODULE_2__.PrismLight.registerLanguage("markdown", (react_syntax_highlighter_dist_cjs_languages_prism_json__WEBPACK_IMPORTED_MODULE_5___default()));
react_syntax_highlighter__WEBPACK_IMPORTED_MODULE_2__.PrismLight.registerLanguage("sass", (react_syntax_highlighter_dist_cjs_languages_prism_sass__WEBPACK_IMPORTED_MODULE_7___default()));
react_syntax_highlighter__WEBPACK_IMPORTED_MODULE_2__.PrismLight.registerLanguage("html", (react_syntax_highlighter_dist_cjs_languages_prism_xml_doc__WEBPACK_IMPORTED_MODULE_8___default()));
/**
 * Build the headers in markdown
 * @param param0
 * @returns
 */ const Headings = ({ level , children  })=>{
    console.log(level);
    // Access actual (string) value of heading
    if (children[0]) {
        const heading = children[0];
        // If we have a heading, make it lower case
        let anchor = heading.toString().toLowerCase();
        // Clean anchor (replace special characters whitespaces).
        // Alternatively, use encodeURIComponent() if you don't care about
        // pretty anchor links
        anchor = anchor.replace(/[^a-zA-Z0-9 ]/g, "");
        anchor = anchor.replace(/ /g, "-");
        // Utility
        const container = (children)=>/*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
                children: [
                    children,
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("a", {
                        id: anchor,
                        href: `#${anchor}`,
                        className: "doc-link",
                        onClick: (e)=>console.log(e)
                    })
                ]
            });
        switch(level){
            case 1:
                return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h1", {
                    children: container(children)
                });
            case 2:
                return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h2", {
                    children: container(children)
                });
            case 3:
                return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h3", {
                    children: container(children)
                });
            case 4:
                return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h4", {
                    children: container(children)
                });
            case 5:
                return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h5", {
                    children: container(children)
                });
            case 6:
                return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h6", {
                    children: container(children)
                });
            default:
                return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h6", {
                    children: container(children)
                });
        }
    } else {
        return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h1", {
            children: "children"
        });
    }
};
/**
 * Build custom renderers for markdown
 */ const MarkdownComponents = {
    h1: Headings,
    h2: Headings,
    h3: Headings,
    h4: Headings,
    h5: Headings,
    h6: Headings,
    code (props) {
        const { className  } = props;
        const match = /language-(\w+)/.exec(className || "");
        if (props.children[0]) {
            props.children[0] = props.children[0].toString().trim();
        }
        return match ? /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_syntax_highlighter__WEBPACK_IMPORTED_MODULE_2__.PrismLight, {
            // @ts-ignore
            style: react_syntax_highlighter_dist_cjs_styles_prism__WEBPACK_IMPORTED_MODULE_3__.oneLight,
            language: match[1],
            PreTag: "div",
            showLineNumbers: true,
            wrapLines: true,
            useInlineStyles: true,
            ...props
        }) : /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("code", {
            ...props
        });
    }
};
/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = ((/* unused pure expression or super */ null && (Headings)));


/***/ })

};
;