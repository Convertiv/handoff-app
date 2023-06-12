"use strict";
exports.id = 494;
exports.ids = [494];
exports.modules = {

/***/ 8494:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "Z": () => (/* binding */ components_AnchorNav)
});

// UNUSED EXPORTS: AnchorNav

// EXTERNAL MODULE: external "react/jsx-runtime"
var jsx_runtime_ = __webpack_require__(997);
// EXTERNAL MODULE: external "react"
var external_react_ = __webpack_require__(6689);
var external_react_default = /*#__PURE__*/__webpack_require__.n(external_react_);
// EXTERNAL MODULE: external "react-scroll"
var external_react_scroll_ = __webpack_require__(3094);
;// CONCATENATED MODULE: ./components/AnchorNavLink.tsx



const AnchorNavLink = ({ to , children  })=>{
    const { 0: offset , 1: setOffset  } = (0,external_react_.useState)(0);
    (0,external_react_.useEffect)(()=>{
        setOffset(document.getElementById("site-header")?.clientHeight ?? 0);
    }, []);
    return /*#__PURE__*/ jsx_runtime_.jsx(external_react_scroll_.Link, {
        href: "#",
        activeClass: "is-selected",
        smooth: true,
        spy: true,
        to: to,
        offset: offset * -1.5,
        onClick: ()=>{
            history.pushState ? history.pushState(null, "", `#${to}`) : location.hash = `#${to}`;
        },
        children: children
    });
};
/* harmony default export */ const components_AnchorNavLink = (AnchorNavLink);

;// CONCATENATED MODULE: ./components/AnchorNav.tsx



const AnchorNav = ({ title , groups  })=>{
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("ul", {
        className: "c-anchor-nav",
        children: [
            /*#__PURE__*/ jsx_runtime_.jsx("li", {
                children: /*#__PURE__*/ jsx_runtime_.jsx("p", {
                    children: title ?? "Contents"
                })
            }),
            groups?.map((linkGroup, i)=>/*#__PURE__*/ (0,jsx_runtime_.jsxs)((external_react_default()).Fragment, {
                    children: [
                        Object.entries(linkGroup).map(([key, value])=>/*#__PURE__*/ jsx_runtime_.jsx("li", {
                                children: /*#__PURE__*/ jsx_runtime_.jsx(components_AnchorNavLink, {
                                    to: key,
                                    children: value
                                })
                            }, `link-${key}`)),
                        i !== groups.length - 1 && /*#__PURE__*/ jsx_runtime_.jsx("li", {
                            children: /*#__PURE__*/ jsx_runtime_.jsx("hr", {})
                        })
                    ]
                }, `link-group-${i}`))
        ]
    });
};
/* harmony default export */ const components_AnchorNav = (AnchorNav);


/***/ })

};
;