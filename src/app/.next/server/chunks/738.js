"use strict";
exports.id = 738;
exports.ids = [738];
exports.modules = {

/***/ 5828:
/***/ ((__unused_webpack_module, exports) => {

/**
 * @license React
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var b=Symbol.for("react.element"),c=Symbol.for("react.portal"),d=Symbol.for("react.fragment"),e=Symbol.for("react.strict_mode"),f=Symbol.for("react.profiler"),g=Symbol.for("react.provider"),h=Symbol.for("react.context"),k=Symbol.for("react.server_context"),l=Symbol.for("react.forward_ref"),m=Symbol.for("react.suspense"),n=Symbol.for("react.suspense_list"),p=Symbol.for("react.memo"),q=Symbol.for("react.lazy"),t=Symbol.for("react.offscreen"),u;u=Symbol.for("react.module.reference");
function v(a){if("object"===typeof a&&null!==a){var r=a.$$typeof;switch(r){case b:switch(a=a.type,a){case d:case f:case e:case m:case n:return a;default:switch(a=a&&a.$$typeof,a){case k:case h:case l:case q:case p:case g:return a;default:return r}}case c:return r}}}exports.ContextConsumer=h;exports.ContextProvider=g;exports.Element=b;exports.ForwardRef=l;exports.Fragment=d;exports.Lazy=q;exports.Memo=p;exports.Portal=c;exports.Profiler=f;exports.StrictMode=e;exports.Suspense=m;
exports.SuspenseList=n;exports.isAsyncMode=function(){return!1};exports.isConcurrentMode=function(){return!1};exports.isContextConsumer=function(a){return v(a)===h};exports.isContextProvider=function(a){return v(a)===g};exports.isElement=function(a){return"object"===typeof a&&null!==a&&a.$$typeof===b};exports.isForwardRef=function(a){return v(a)===l};exports.isFragment=function(a){return v(a)===d};exports.isLazy=function(a){return v(a)===q};exports.isMemo=function(a){return v(a)===p};
exports.isPortal=function(a){return v(a)===c};exports.isProfiler=function(a){return v(a)===f};exports.isStrictMode=function(a){return v(a)===e};exports.isSuspense=function(a){return v(a)===m};exports.isSuspenseList=function(a){return v(a)===n};
exports.isValidElementType=function(a){return"string"===typeof a||"function"===typeof a||a===d||a===f||a===e||a===m||a===n||a===t||"object"===typeof a&&null!==a&&(a.$$typeof===q||a.$$typeof===p||a.$$typeof===g||a.$$typeof===h||a.$$typeof===l||a.$$typeof===u||void 0!==a.getModuleId)?!0:!1};exports.typeOf=v;


/***/ }),

/***/ 3978:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



if (true) {
  module.exports = __webpack_require__(5828);
} else {}


/***/ }),

/***/ 8448:
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "I": () => (/* binding */ childrenToReact)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6689);
/* harmony import */ var react_is__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3978);
/* harmony import */ var hast_util_whitespace__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9492);
/* harmony import */ var property_information__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(6861);
/* harmony import */ var space_separated_tokens__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(1152);
/* harmony import */ var comma_separated_tokens__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(4955);
/* harmony import */ var style_to_object__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(7785);
/* harmony import */ var _uri_transformer_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(6504);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([hast_util_whitespace__WEBPACK_IMPORTED_MODULE_2__, property_information__WEBPACK_IMPORTED_MODULE_3__, space_separated_tokens__WEBPACK_IMPORTED_MODULE_4__, comma_separated_tokens__WEBPACK_IMPORTED_MODULE_5__, style_to_object__WEBPACK_IMPORTED_MODULE_6__]);
([hast_util_whitespace__WEBPACK_IMPORTED_MODULE_2__, property_information__WEBPACK_IMPORTED_MODULE_3__, space_separated_tokens__WEBPACK_IMPORTED_MODULE_4__, comma_separated_tokens__WEBPACK_IMPORTED_MODULE_5__, style_to_object__WEBPACK_IMPORTED_MODULE_6__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);
/**
 * @template T
 * @typedef {import('react').ComponentType<T>} ComponentType<T>
 */

/**
 * @template {import('react').ElementType} T
 * @typedef {import('react').ComponentPropsWithoutRef<T>} ComponentPropsWithoutRef<T>
 */

/**
 * @typedef {import('react').ReactNode} ReactNode
 * @typedef {import('unist').Position} Position
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').ElementContent} ElementContent
 * @typedef {import('hast').Root} Root
 * @typedef {import('hast').Text} Text
 * @typedef {import('hast').Comment} Comment
 * @typedef {import('hast').DocType} Doctype
 * @typedef {import('property-information').Info} Info
 * @typedef {import('property-information').Schema} Schema
 * @typedef {import('./complex-types.js').ReactMarkdownProps} ReactMarkdownProps
 *
 * @typedef Raw
 * @property {'raw'} type
 * @property {string} value
 *
 * @typedef Context
 * @property {Options} options
 * @property {Schema} schema
 * @property {number} listDepth
 *
 * @callback TransformLink
 * @param {string} href
 * @param {Array<ElementContent>} children
 * @param {string?} title
 * @returns {string}
 *
 * @callback TransformImage
 * @param {string} src
 * @param {string} alt
 * @param {string?} title
 * @returns {string}
 *
 * @typedef {import('react').HTMLAttributeAnchorTarget} TransformLinkTargetType
 *
 * @callback TransformLinkTarget
 * @param {string} href
 * @param {Array<ElementContent>} children
 * @param {string?} title
 * @returns {TransformLinkTargetType|undefined}
 *
 * @typedef {keyof JSX.IntrinsicElements} ReactMarkdownNames
 *
 * To do: is `data-sourcepos` typeable?
 *
 * @typedef {ComponentPropsWithoutRef<'code'> & ReactMarkdownProps & {inline?: boolean}} CodeProps
 * @typedef {ComponentPropsWithoutRef<'h1'> & ReactMarkdownProps & {level: number}} HeadingProps
 * @typedef {ComponentPropsWithoutRef<'li'> & ReactMarkdownProps & {checked: boolean|null, index: number, ordered: boolean}} LiProps
 * @typedef {ComponentPropsWithoutRef<'ol'> & ReactMarkdownProps & {depth: number, ordered: true}} OrderedListProps
 * @typedef {ComponentPropsWithoutRef<'td'> & ReactMarkdownProps & {style?: Record<string, unknown>, isHeader: false}} TableDataCellProps
 * @typedef {ComponentPropsWithoutRef<'th'> & ReactMarkdownProps & {style?: Record<string, unknown>, isHeader: true}} TableHeaderCellProps
 * @typedef {ComponentPropsWithoutRef<'tr'> & ReactMarkdownProps & {isHeader: boolean}} TableRowProps
 * @typedef {ComponentPropsWithoutRef<'ul'> & ReactMarkdownProps & {depth: number, ordered: false}} UnorderedListProps
 *
 * @typedef {ComponentType<CodeProps>} CodeComponent
 * @typedef {ComponentType<HeadingProps>} HeadingComponent
 * @typedef {ComponentType<LiProps>} LiComponent
 * @typedef {ComponentType<OrderedListProps>} OrderedListComponent
 * @typedef {ComponentType<TableDataCellProps>} TableDataCellComponent
 * @typedef {ComponentType<TableHeaderCellProps>} TableHeaderCellComponent
 * @typedef {ComponentType<TableRowProps>} TableRowComponent
 * @typedef {ComponentType<UnorderedListProps>} UnorderedListComponent
 *
 * @typedef SpecialComponents
 * @property {CodeComponent|ReactMarkdownNames} code
 * @property {HeadingComponent|ReactMarkdownNames} h1
 * @property {HeadingComponent|ReactMarkdownNames} h2
 * @property {HeadingComponent|ReactMarkdownNames} h3
 * @property {HeadingComponent|ReactMarkdownNames} h4
 * @property {HeadingComponent|ReactMarkdownNames} h5
 * @property {HeadingComponent|ReactMarkdownNames} h6
 * @property {LiComponent|ReactMarkdownNames} li
 * @property {OrderedListComponent|ReactMarkdownNames} ol
 * @property {TableDataCellComponent|ReactMarkdownNames} td
 * @property {TableHeaderCellComponent|ReactMarkdownNames} th
 * @property {TableRowComponent|ReactMarkdownNames} tr
 * @property {UnorderedListComponent|ReactMarkdownNames} ul
 *
 * @typedef {Partial<Omit<import('./complex-types.js').NormalComponents, keyof SpecialComponents> & SpecialComponents>} Components
 *
 * @typedef Options
 * @property {boolean} [sourcePos=false]
 * @property {boolean} [rawSourcePos=false]
 * @property {boolean} [skipHtml=false]
 * @property {boolean} [includeElementIndex=false]
 * @property {null|false|TransformLink} [transformLinkUri]
 * @property {TransformImage} [transformImageUri]
 * @property {TransformLinkTargetType|TransformLinkTarget} [linkTarget]
 * @property {Components} [components]
 */










const own = {}.hasOwnProperty

// The table-related elements that must not contain whitespace text according
// to React.
const tableElements = new Set(['table', 'thead', 'tbody', 'tfoot', 'tr'])

/**
 * @param {Context} context
 * @param {Element|Root} node
 */
function childrenToReact(context, node) {
  /** @type {Array<ReactNode>} */
  const children = []
  let childIndex = -1
  /** @type {Comment|Doctype|Element|Raw|Text} */
  let child

  while (++childIndex < node.children.length) {
    child = node.children[childIndex]

    if (child.type === 'element') {
      children.push(toReact(context, child, childIndex, node))
    } else if (child.type === 'text') {
      // Currently, a warning is triggered by react for *any* white space in
      // tables.
      // So we drop it.
      // See: <https://github.com/facebook/react/pull/7081>.
      // See: <https://github.com/facebook/react/pull/7515>.
      // See: <https://github.com/remarkjs/remark-react/issues/64>.
      // See: <https://github.com/remarkjs/react-markdown/issues/576>.
      if (
        node.type !== 'element' ||
        !tableElements.has(node.tagName) ||
        !(0,hast_util_whitespace__WEBPACK_IMPORTED_MODULE_2__.whitespace)(child)
      ) {
        children.push(child.value)
      }
    } else if (child.type === 'raw' && !context.options.skipHtml) {
      // Default behavior is to show (encoded) HTML.
      children.push(child.value)
    }
  }

  return children
}

/**
 * @param {Context} context
 * @param {Element} node
 * @param {number} index
 * @param {Element|Root} parent
 */
function toReact(context, node, index, parent) {
  const options = context.options
  const transform =
    options.transformLinkUri === undefined
      ? _uri_transformer_js__WEBPACK_IMPORTED_MODULE_7__/* .uriTransformer */ .A
      : options.transformLinkUri
  const parentSchema = context.schema
  /** @type {ReactMarkdownNames} */
  // @ts-expect-error assume a known HTML/SVG element.
  const name = node.tagName
  /** @type {Record<string, unknown>} */
  const properties = {}
  let schema = parentSchema
  /** @type {string} */
  let property

  if (parentSchema.space === 'html' && name === 'svg') {
    schema = property_information__WEBPACK_IMPORTED_MODULE_3__.svg
    context.schema = schema
  }

  if (node.properties) {
    for (property in node.properties) {
      if (own.call(node.properties, property)) {
        addProperty(properties, property, node.properties[property], context)
      }
    }
  }

  if (name === 'ol' || name === 'ul') {
    context.listDepth++
  }

  const children = childrenToReact(context, node)

  if (name === 'ol' || name === 'ul') {
    context.listDepth--
  }

  // Restore parent schema.
  context.schema = parentSchema

  // Nodes created by plugins do not have positional info, in which case we use
  // an object that matches the position interface.
  const position = node.position || {
    start: {line: null, column: null, offset: null},
    end: {line: null, column: null, offset: null}
  }
  const component =
    options.components && own.call(options.components, name)
      ? options.components[name]
      : name
  const basic = typeof component === 'string' || component === react__WEBPACK_IMPORTED_MODULE_0__.Fragment

  if (!react_is__WEBPACK_IMPORTED_MODULE_1__.isValidElementType(component)) {
    throw new TypeError(
      `Component for name \`${name}\` not defined or is not renderable`
    )
  }

  properties.key = index

  if (name === 'a' && options.linkTarget) {
    properties.target =
      typeof options.linkTarget === 'function'
        ? options.linkTarget(
            String(properties.href || ''),
            node.children,
            typeof properties.title === 'string' ? properties.title : null
          )
        : options.linkTarget
  }

  if (name === 'a' && transform) {
    properties.href = transform(
      String(properties.href || ''),
      node.children,
      typeof properties.title === 'string' ? properties.title : null
    )
  }

  if (
    !basic &&
    name === 'code' &&
    parent.type === 'element' &&
    parent.tagName !== 'pre'
  ) {
    properties.inline = true
  }

  if (
    !basic &&
    (name === 'h1' ||
      name === 'h2' ||
      name === 'h3' ||
      name === 'h4' ||
      name === 'h5' ||
      name === 'h6')
  ) {
    properties.level = Number.parseInt(name.charAt(1), 10)
  }

  if (name === 'img' && options.transformImageUri) {
    properties.src = options.transformImageUri(
      String(properties.src || ''),
      String(properties.alt || ''),
      typeof properties.title === 'string' ? properties.title : null
    )
  }

  if (!basic && name === 'li' && parent.type === 'element') {
    const input = getInputElement(node)
    properties.checked =
      input && input.properties ? Boolean(input.properties.checked) : null
    properties.index = getElementsBeforeCount(parent, node)
    properties.ordered = parent.tagName === 'ol'
  }

  if (!basic && (name === 'ol' || name === 'ul')) {
    properties.ordered = name === 'ol'
    properties.depth = context.listDepth
  }

  if (name === 'td' || name === 'th') {
    if (properties.align) {
      if (!properties.style) properties.style = {}
      // @ts-expect-error assume `style` is an object
      properties.style.textAlign = properties.align
      delete properties.align
    }

    if (!basic) {
      properties.isHeader = name === 'th'
    }
  }

  if (!basic && name === 'tr' && parent.type === 'element') {
    properties.isHeader = Boolean(parent.tagName === 'thead')
  }

  // If `sourcePos` is given, pass source information (line/column info from markdown source).
  if (options.sourcePos) {
    properties['data-sourcepos'] = flattenPosition(position)
  }

  if (!basic && options.rawSourcePos) {
    properties.sourcePosition = node.position
  }

  // If `includeElementIndex` is given, pass node index info to components.
  if (!basic && options.includeElementIndex) {
    properties.index = getElementsBeforeCount(parent, node)
    properties.siblingCount = getElementsBeforeCount(parent)
  }

  if (!basic) {
    properties.node = node
  }

  // Ensure no React warnings are emitted for void elements w/ children.
  return children.length > 0
    ? react__WEBPACK_IMPORTED_MODULE_0__.createElement(component, properties, children)
    : react__WEBPACK_IMPORTED_MODULE_0__.createElement(component, properties)
}

/**
 * @param {Element|Root} node
 * @returns {Element?}
 */
function getInputElement(node) {
  let index = -1

  while (++index < node.children.length) {
    const child = node.children[index]

    if (child.type === 'element' && child.tagName === 'input') {
      return child
    }
  }

  return null
}

/**
 * @param {Element|Root} parent
 * @param {Element} [node]
 * @returns {number}
 */
function getElementsBeforeCount(parent, node) {
  let index = -1
  let count = 0

  while (++index < parent.children.length) {
    if (parent.children[index] === node) break
    if (parent.children[index].type === 'element') count++
  }

  return count
}

/**
 * @param {Record<string, unknown>} props
 * @param {string} prop
 * @param {unknown} value
 * @param {Context} ctx
 */
function addProperty(props, prop, value, ctx) {
  const info = (0,property_information__WEBPACK_IMPORTED_MODULE_3__.find)(ctx.schema, prop)
  let result = value

  // Ignore nullish and `NaN` values.
  // eslint-disable-next-line no-self-compare
  if (result === null || result === undefined || result !== result) {
    return
  }

  // Accept `array`.
  // Most props are space-separated.
  if (Array.isArray(result)) {
    result = info.commaSeparated ? (0,comma_separated_tokens__WEBPACK_IMPORTED_MODULE_5__.stringify)(result) : (0,space_separated_tokens__WEBPACK_IMPORTED_MODULE_4__.stringify)(result)
  }

  if (info.property === 'style' && typeof result === 'string') {
    result = parseStyle(result)
  }

  if (info.space && info.property) {
    props[
      own.call(property_information__WEBPACK_IMPORTED_MODULE_3__.hastToReact, info.property)
        ? property_information__WEBPACK_IMPORTED_MODULE_3__.hastToReact[info.property]
        : info.property
    ] = result
  } else if (info.attribute) {
    props[info.attribute] = result
  }
}

/**
 * @param {string} value
 * @returns {Record<string, string>}
 */
function parseStyle(value) {
  /** @type {Record<string, string>} */
  const result = {}

  try {
    ;(0,style_to_object__WEBPACK_IMPORTED_MODULE_6__["default"])(value, iterator)
  } catch {
    // Silent.
  }

  return result

  /**
   * @param {string} name
   * @param {string} v
   */
  function iterator(name, v) {
    const k = name.slice(0, 4) === '-ms-' ? `ms-${name.slice(4)}` : name
    result[k.replace(/-([a-z])/g, styleReplacer)] = v
  }
}

/**
 * @param {unknown} _
 * @param {string} $1
 */
function styleReplacer(_, $1) {
  return $1.toUpperCase()
}

/**
 * @param {Position|{start: {line: null, column: null, offset: null}, end: {line: null, column: null, offset: null}}} pos
 * @returns {string}
 */
function flattenPosition(pos) {
  return [
    pos.start.line,
    ':',
    pos.start.column,
    '-',
    pos.end.line,
    ':',
    pos.end.column
  ]
    .map(String)
    .join('')
}

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ 738:
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "D": () => (/* binding */ ReactMarkdown)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6689);
/* harmony import */ var vfile__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6107);
/* harmony import */ var unified__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(4390);
/* harmony import */ var remark_parse__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(6688);
/* harmony import */ var remark_rehype__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(2509);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(580);
/* harmony import */ var property_information__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(6861);
/* harmony import */ var _rehype_filter_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(3820);
/* harmony import */ var _ast_to_react_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(8448);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([vfile__WEBPACK_IMPORTED_MODULE_1__, unified__WEBPACK_IMPORTED_MODULE_2__, remark_parse__WEBPACK_IMPORTED_MODULE_3__, remark_rehype__WEBPACK_IMPORTED_MODULE_4__, property_information__WEBPACK_IMPORTED_MODULE_6__, _rehype_filter_js__WEBPACK_IMPORTED_MODULE_7__, _ast_to_react_js__WEBPACK_IMPORTED_MODULE_8__]);
([vfile__WEBPACK_IMPORTED_MODULE_1__, unified__WEBPACK_IMPORTED_MODULE_2__, remark_parse__WEBPACK_IMPORTED_MODULE_3__, remark_rehype__WEBPACK_IMPORTED_MODULE_4__, property_information__WEBPACK_IMPORTED_MODULE_6__, _rehype_filter_js__WEBPACK_IMPORTED_MODULE_7__, _ast_to_react_js__WEBPACK_IMPORTED_MODULE_8__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);
/**
 * @typedef {import('react').ReactNode} ReactNode
 * @typedef {import('react').ReactElement<{}>} ReactElement
 * @typedef {import('unified').PluggableList} PluggableList
 * @typedef {import('hast').Root} Root
 * @typedef {import('./rehype-filter.js').Options} FilterOptions
 * @typedef {import('./ast-to-react.js').Options} TransformOptions
 *
 * @typedef CoreOptions
 * @property {string} children
 *
 * @typedef PluginOptions
 * @property {PluggableList} [remarkPlugins=[]]
 * @property {PluggableList} [rehypePlugins=[]]
 * @property {import('remark-rehype').Options | undefined} [remarkRehypeOptions={}]
 *
 * @typedef LayoutOptions
 * @property {string} [className]
 *
 * @typedef {CoreOptions & PluginOptions & LayoutOptions & FilterOptions & TransformOptions} ReactMarkdownOptions
 *
 * @typedef Deprecation
 * @property {string} id
 * @property {string} [to]
 */











const own = {}.hasOwnProperty
const changelog =
  'https://github.com/remarkjs/react-markdown/blob/main/changelog.md'

/** @type {Record<string, Deprecation>} */
const deprecated = {
  plugins: {to: 'remarkPlugins', id: 'change-plugins-to-remarkplugins'},
  renderers: {to: 'components', id: 'change-renderers-to-components'},
  astPlugins: {id: 'remove-buggy-html-in-markdown-parser'},
  allowDangerousHtml: {id: 'remove-buggy-html-in-markdown-parser'},
  escapeHtml: {id: 'remove-buggy-html-in-markdown-parser'},
  source: {to: 'children', id: 'change-source-to-children'},
  allowNode: {
    to: 'allowElement',
    id: 'replace-allownode-allowedtypes-and-disallowedtypes'
  },
  allowedTypes: {
    to: 'allowedElements',
    id: 'replace-allownode-allowedtypes-and-disallowedtypes'
  },
  disallowedTypes: {
    to: 'disallowedElements',
    id: 'replace-allownode-allowedtypes-and-disallowedtypes'
  },
  includeNodeIndex: {
    to: 'includeElementIndex',
    id: 'change-includenodeindex-to-includeelementindex'
  }
}

/**
 * React component to render markdown.
 *
 * @param {ReactMarkdownOptions} options
 * @returns {ReactElement}
 */
function ReactMarkdown(options) {
  for (const key in deprecated) {
    if (own.call(deprecated, key) && own.call(options, key)) {
      const deprecation = deprecated[key]
      console.warn(
        `[react-markdown] Warning: please ${
          deprecation.to ? `use \`${deprecation.to}\` instead of` : 'remove'
        } \`${key}\` (see <${changelog}#${deprecation.id}> for more info)`
      )
      delete deprecated[key]
    }
  }

  const processor = (0,unified__WEBPACK_IMPORTED_MODULE_2__.unified)()
    .use(remark_parse__WEBPACK_IMPORTED_MODULE_3__["default"])
    .use(options.remarkPlugins || [])
    .use(remark_rehype__WEBPACK_IMPORTED_MODULE_4__["default"], {
      ...options.remarkRehypeOptions,
      allowDangerousHtml: true
    })
    .use(options.rehypePlugins || [])
    .use(_rehype_filter_js__WEBPACK_IMPORTED_MODULE_7__/* ["default"] */ .Z, options)

  const file = new vfile__WEBPACK_IMPORTED_MODULE_1__.VFile()

  if (typeof options.children === 'string') {
    file.value = options.children
  } else if (options.children !== undefined && options.children !== null) {
    console.warn(
      `[react-markdown] Warning: please pass a string as \`children\` (not: \`${options.children}\`)`
    )
  }

  const hastNode = processor.runSync(processor.parse(file), file)

  if (hastNode.type !== 'root') {
    throw new TypeError('Expected a `root` node')
  }

  /** @type {ReactElement} */
  let result = react__WEBPACK_IMPORTED_MODULE_0__.createElement(
    react__WEBPACK_IMPORTED_MODULE_0__.Fragment,
    {},
    (0,_ast_to_react_js__WEBPACK_IMPORTED_MODULE_8__/* .childrenToReact */ .I)({options, schema: property_information__WEBPACK_IMPORTED_MODULE_6__.html, listDepth: 0}, hastNode)
  )

  if (options.className) {
    result = react__WEBPACK_IMPORTED_MODULE_0__.createElement('div', {className: options.className}, result)
  }

  return result
}

ReactMarkdown.propTypes = {
  // Core options:
  children: prop_types__WEBPACK_IMPORTED_MODULE_5__.string,
  // Layout options:
  className: prop_types__WEBPACK_IMPORTED_MODULE_5__.string,
  // Filter options:
  allowElement: prop_types__WEBPACK_IMPORTED_MODULE_5__.func,
  allowedElements: prop_types__WEBPACK_IMPORTED_MODULE_5__.arrayOf(prop_types__WEBPACK_IMPORTED_MODULE_5__.string),
  disallowedElements: prop_types__WEBPACK_IMPORTED_MODULE_5__.arrayOf(prop_types__WEBPACK_IMPORTED_MODULE_5__.string),
  unwrapDisallowed: prop_types__WEBPACK_IMPORTED_MODULE_5__.bool,
  // Plugin options:
  remarkPlugins: prop_types__WEBPACK_IMPORTED_MODULE_5__.arrayOf(
    prop_types__WEBPACK_IMPORTED_MODULE_5__.oneOfType([
      prop_types__WEBPACK_IMPORTED_MODULE_5__.object,
      prop_types__WEBPACK_IMPORTED_MODULE_5__.func,
      prop_types__WEBPACK_IMPORTED_MODULE_5__.arrayOf(
        prop_types__WEBPACK_IMPORTED_MODULE_5__.oneOfType([
          prop_types__WEBPACK_IMPORTED_MODULE_5__.bool,
          prop_types__WEBPACK_IMPORTED_MODULE_5__.string,
          prop_types__WEBPACK_IMPORTED_MODULE_5__.object,
          prop_types__WEBPACK_IMPORTED_MODULE_5__.func,
          prop_types__WEBPACK_IMPORTED_MODULE_5__.arrayOf(
            // prettier-ignore
            // type-coverage:ignore-next-line
            prop_types__WEBPACK_IMPORTED_MODULE_5__.any
          )
        ])
      )
    ])
  ),
  rehypePlugins: prop_types__WEBPACK_IMPORTED_MODULE_5__.arrayOf(
    prop_types__WEBPACK_IMPORTED_MODULE_5__.oneOfType([
      prop_types__WEBPACK_IMPORTED_MODULE_5__.object,
      prop_types__WEBPACK_IMPORTED_MODULE_5__.func,
      prop_types__WEBPACK_IMPORTED_MODULE_5__.arrayOf(
        prop_types__WEBPACK_IMPORTED_MODULE_5__.oneOfType([
          prop_types__WEBPACK_IMPORTED_MODULE_5__.bool,
          prop_types__WEBPACK_IMPORTED_MODULE_5__.string,
          prop_types__WEBPACK_IMPORTED_MODULE_5__.object,
          prop_types__WEBPACK_IMPORTED_MODULE_5__.func,
          prop_types__WEBPACK_IMPORTED_MODULE_5__.arrayOf(
            // prettier-ignore
            // type-coverage:ignore-next-line
            prop_types__WEBPACK_IMPORTED_MODULE_5__.any
          )
        ])
      )
    ])
  ),
  // Transform options:
  sourcePos: prop_types__WEBPACK_IMPORTED_MODULE_5__.bool,
  rawSourcePos: prop_types__WEBPACK_IMPORTED_MODULE_5__.bool,
  skipHtml: prop_types__WEBPACK_IMPORTED_MODULE_5__.bool,
  includeElementIndex: prop_types__WEBPACK_IMPORTED_MODULE_5__.bool,
  transformLinkUri: prop_types__WEBPACK_IMPORTED_MODULE_5__.oneOfType([prop_types__WEBPACK_IMPORTED_MODULE_5__.func, prop_types__WEBPACK_IMPORTED_MODULE_5__.bool]),
  linkTarget: prop_types__WEBPACK_IMPORTED_MODULE_5__.oneOfType([prop_types__WEBPACK_IMPORTED_MODULE_5__.func, prop_types__WEBPACK_IMPORTED_MODULE_5__.string]),
  transformImageUri: prop_types__WEBPACK_IMPORTED_MODULE_5__.func,
  components: prop_types__WEBPACK_IMPORTED_MODULE_5__.object
}

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ 3820:
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (/* binding */ rehypeFilter)
/* harmony export */ });
/* harmony import */ var unist_util_visit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6016);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([unist_util_visit__WEBPACK_IMPORTED_MODULE_0__]);
unist_util_visit__WEBPACK_IMPORTED_MODULE_0__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];


/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('hast').Root} Root
 * @typedef {import('hast').Element} Element
 *
 * @callback AllowElement
 * @param {Element} element
 * @param {number} index
 * @param {Element|Root} parent
 * @returns {boolean|undefined}
 *
 * @typedef Options
 * @property {Array<string>} [allowedElements]
 * @property {Array<string>} [disallowedElements=[]]
 * @property {AllowElement} [allowElement]
 * @property {boolean} [unwrapDisallowed=false]
 */

/**
 * @type {import('unified').Plugin<[Options], Root>}
 */
function rehypeFilter(options) {
  if (options.allowedElements && options.disallowedElements) {
    throw new TypeError(
      'Only one of `allowedElements` and `disallowedElements` should be defined'
    )
  }

  if (
    options.allowedElements ||
    options.disallowedElements ||
    options.allowElement
  ) {
    return (tree) => {
      (0,unist_util_visit__WEBPACK_IMPORTED_MODULE_0__.visit)(tree, 'element', (node, index, parent_) => {
        const parent = /** @type {Element|Root} */ (parent_)
        /** @type {boolean|undefined} */
        let remove

        if (options.allowedElements) {
          remove = !options.allowedElements.includes(node.tagName)
        } else if (options.disallowedElements) {
          remove = options.disallowedElements.includes(node.tagName)
        }

        if (!remove && options.allowElement && typeof index === 'number') {
          remove = !options.allowElement(node, index, parent)
        }

        if (remove && typeof index === 'number') {
          if (options.unwrapDisallowed && node.children) {
            parent.children.splice(index, 1, ...node.children)
          } else {
            parent.children.splice(index, 1)
          }

          return index
        }

        return undefined
      })
    }
  }
}

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ 6504:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "A": () => (/* binding */ uriTransformer)
/* harmony export */ });
const protocols = ['http', 'https', 'mailto', 'tel']

/**
 * @param {string} uri
 * @returns {string}
 */
function uriTransformer(uri) {
  const url = (uri || '').trim()
  const first = url.charAt(0)

  if (first === '#' || first === '/') {
    return url
  }

  const colon = url.indexOf(':')
  if (colon === -1) {
    return url
  }

  let index = -1

  while (++index < protocols.length) {
    const protocol = protocols[index]

    if (
      colon === protocol.length &&
      url.slice(0, protocol.length).toLowerCase() === protocol
    ) {
      return url
    }
  }

  index = url.indexOf('?')
  if (index !== -1 && colon > index) {
    return url
  }

  index = url.indexOf('#')
  if (index !== -1 && colon > index) {
    return url
  }

  // eslint-disable-next-line no-script-url
  return 'javascript:void(0)'
}


/***/ })

};
;