"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postWordPressIntegration = void 0;
var Utils = __importStar(require("../../utils"));
var convertColor_1 = require("../../utils/convertColor");
var lodash_1 = require("lodash");
var postWordPressIntegration = function (documentationObject, artifacts) {
    var theme = getWordPressThemeObject();
    //#region colors
    var pallete = [];
    var gradients = [];
    documentationObject.design.color.forEach(function (color) {
        color.value.includes('-gradient')
            ? gradients.push({ name: color.name, slug: "".concat(color.group, "-").concat(color.machineName), gradient: color.value })
            : pallete.push({ name: color.name, slug: "".concat(color.group, "-").concat(color.machineName), color: color.value });
    });
    //#endregion colors
    //#region typography
    var typography = documentationObject.design.typography;
    var uniqueFontFamilies = Array.from((new Set(typography.map(function (type) { return type.values.fontFamily; }))).values());
    var fontFamilies = uniqueFontFamilies.map(function (fontFamily) {
        return {
            name: fontFamily,
            slug: Utils.slugify(fontFamily),
            fontFamily: fontFamily,
        };
    });
    var fontSizes = documentationObject.design.typography.map(function (type) {
        return {
            name: type.name,
            slug: type.machine_name,
            size: "".concat(type.values.fontSize, "px"),
        };
    });
    var headings = typography.filter(function (item) { return item.machine_name.includes('heading-'); }).map(function (item) {
        var _a;
        // return object where key is item.machine_name and suboject is item.values.fontSize
        return _a = {},
            _a[item.machine_name.charAt(0) + item.machine_name.charAt(8)] = {
                typography: {
                    fontSize: "".concat(item.values.fontSize, "px"),
                    fontWeight: "".concat(item.values.fontWeight)
                },
                color: {
                    text: item.values.color
                }
            },
            _a;
    });
    //#endregion typography
    //#region core/button
    var buttons = documentationObject.components.button
        .filter(function (button) {
        var variantProperties = new Map(button.variantProperties);
        return button.type === 'design' && variantProperties.get('Theme') === 'light' && variantProperties.get('State') !== 'disabled';
    })
        .map(function (button) {
        var _a;
        var variantProps = new Map(button.variantProperties);
        var rootTokenSets = (_a = button.parts) === null || _a === void 0 ? void 0 : _a.$;
        var background = rootTokenSets.filter(function (set) { return set.name === 'BACKGROUND'; })[0];
        var fill = rootTokenSets.filter(function (set) { return set.name === 'FILL'; })[0];
        var typography = rootTokenSets.filter(function (set) { return set.name === 'TYPOGRAPHY'; })[0];
        var spacing = rootTokenSets.filter(function (set) { return set.name === 'SPACING'; })[0];
        var border = rootTokenSets.filter(function (set) { return set.name === 'BORDER'; })[0];
        return {
            name: button.id,
            characters: typography.characters,
            theme: variantProps.get('Theme'),
            type: variantProps.get('Type'),
            state: variantProps.get('State'),
            values: {
                fontFamily: typography.fontFamily,
                fontSize: typography.fontSize,
                fontWeight: typography.fontWeight,
                letterSpacing: typography.letterSpacing,
                lineHeight: typography.lineHeight,
                textDecoration: typography.textDecoration,
                paddingTop: spacing.padding.TOP,
                paddingRight: spacing.padding.RIGHT,
                paddingBottom: spacing.padding.BOTTOM,
                paddingLeft: spacing.padding.LEFT,
                borderWeight: border.weight,
                borderRadius: border.radius,
                borderColor: (border.strokes[0] && border.strokes[0].color) ? (0, convertColor_1.transformFigmaFillsToCssColor)(border.strokes, true).color : '',
                backgroundColor: (0, convertColor_1.transformFigmaFillsToCssColor)(background.background).color,
                color: (0, convertColor_1.transformFigmaFillsToCssColor)(fill.color, true).color,
            }
        };
    });
    var defaultStateButtons = buttons.filter(function (button) { return button.state === 'default'; });
    var buttonPallete = defaultStateButtons.map(function (item) { return ({ name: "".concat(item.type), slug: "".concat(item.name), color: item.values.backgroundColor }); });
    var buttonBackgroundPallete = buttons.map(function (item) { return ({ name: "".concat(item.type), slug: "".concat(item.name), color: item.values.backgroundColor }); });
    var buttonForegroundPallete = buttons.map(function (item) { return ({ name: "".concat(item.type), slug: "".concat(item.name), color: item.values.color }); });
    var custom = {
        button: {
            background: {},
            color: {}
        }
    };
    buttonBackgroundPallete.forEach(function (background) {
        custom.button.background[background.slug] = background.color;
    });
    buttonForegroundPallete.forEach(function (color) {
        custom.button.color[color.slug] = color.color;
    });
    //#endregion core/button
    //#region theme.json
    theme.settings.color.palette = pallete;
    theme.settings.color.gradients = gradients;
    theme.settings.typography.fontFamilies = fontFamilies;
    theme.settings.typography.fontSizes = fontSizes;
    theme.settings.blocks['core/button'].custom = custom;
    theme.settings.blocks['core/button'].color.palette = buttonPallete;
    theme.styles.elements.button = getButtonTypeStyles(buttons, 'primary');
    // NOT SUPPORTED :(((((
    // theme.styles.blocks['core/button'].variations = buttons.reduce((variations, button) => {
    //   variations[button.type] = getButtonTypeStyles(buttons, button.type);
    //   return variations;
    // }, {});
    theme.styles.elements = Object.assign.apply(Object, __spreadArray([{}, theme.styles.elements], headings, false));
    var data = JSON.stringify(theme, null, 2);
    //#endregion theme.json
    //#region functions.php
    var variantPattern = "\n  register_block_style('core/button', [\n\t\t'name' => '${type}',\n\t\t'label' => __('${name}', 'handoff'),\n\t]);";
    var variants = defaultStateButtons.map(function (button) {
        return Utils.replaceTokens(variantPattern, new Map([
            ['name', "".concat((0, lodash_1.startCase)(button.type), " Button")],
            ['type', button.type],
        ]));
    });
    var patternsPattern = "\n  register_block_pattern('handoff-block-patterns/button-${type}', array(\n    'title' => __('${name}', 'handoff'),\n    'description' => __('${name} Button', 'handoff'),\n    'content' => \"<!-- wp:buttons -->\r\n<div class=\\\"wp-block-buttons\\\"><!-- wp:button {\\\"className\\\":\\\"is-style-${type}\\\"} -->\r\n<div class=\\\"wp-block-button is-style-${type}\\\"><a class=\\\"wp-block-button__link wp-element-button\\\">${name}</a></div>\r\n<!-- /wp:button --></div>\r\n<!-- /wp:buttons -->\",\n    'categories' => array('button')\n  ));";
    var patterns = buttons.map(function (button) {
        return Utils.replaceTokens(patternsPattern, new Map([
            ['name', "".concat((0, lodash_1.startCase)(button.type), " Button")],
            ['type', button.type],
        ]));
    });
    // ====
    // BEGIN STYLES BY STYLE
    // ====
    var stylesPattern = ".wp-block-button.is-style-${type} .wp-block-button__link${pseudoClass} { border: ${border} !important; background: ${backgroundColor} !important; color: ${color} !important; }";
    var styles = buttons.map(function (button) {
        return Utils.replaceTokens(stylesPattern, new Map([
            ['type', button.type],
            ['state', button.state],
            // ['color', button.values.color],
            ['color', "var(--wp--custom--button--color--design-theme-".concat(button.theme, "-type-").concat(button.type, "-state-").concat(button.state, ")").toLowerCase()],
            // ['backgroundColor', button.values.backgroundColor],
            ['backgroundColor', "var(--wp--custom--button--background--design-theme-".concat(button.theme, "-type-").concat(button.type, "-state-").concat(button.state, ")").toLowerCase()],
            ['border', button.values.borderColor ? "".concat(button.values.borderWeight, "px solid ").concat(button.values.borderColor) : 'none'],
            ['pseudoClass', button.state === 'hover' ? ':hover' : ''],
        ]));
    });
    // ====
    // END STYLES BY STYLE
    // ====
    // ====
    // BEGIN STYLES BY BACKGROUND
    // ====
    // const stylesPattern = `.wp-block-button .wp-block-button__link.has-design-theme-light-type-$\{type\}-state-default-background-color$\{pseudoClass\} { border: $\{border\} !important; background: $\{backgroundColor\} !important; color: $\{color\} !important; }`
    // const styles = buttons.map(button => {
    //   return Utils.replaceTokens(stylesPattern, new Map([
    //     ['type', button.type],
    //     ['state', button.state],
    //     // ['color', button.values.color],
    //     ['color', `var(--wp--custom--button--color--design-theme-${button.theme}-type-${button.type}-state-${button.state})`.toLowerCase()],
    //     ['backgroundColor', button.values.backgroundColor],
    //     ['border', button.values.borderColor ? `${button.values.borderWeight}px solid ${button.values.borderColor}` : 'none'],
    //     ['pseudoClass', button.state === 'hover' ? ':hover': ''],
    //   ]));
    // });
    // ====
    // END STYLES BY BACKGROUND
    // ====
    var functionsFileContents = "<?php\n\n  #region core/button variants\n  add_action('init', function() {\n    ".concat(variants.join('\r\n'), "\n  });\n  #endregion core/button variants\n  \n  #region core/button patterns\n  function handoff_block_patterns() {\n    ").concat(patterns.join('\r\n'), "\n  }\n  add_action('init', 'handoff_block_patterns');\n  #endregion core/button patterns\n\n  wp_enqueue_style('handoff-style', get_stylesheet_directory_uri() . '/handoff.css');\n\n  function handoff_load_custom_wp_admin_style(){\n    wp_register_style( 'handoff_wp_admin_css', get_stylesheet_directory_uri() . '/handoff.css');\n    wp_enqueue_style( 'handoff_wp_admin_css' );\n  }\n  add_action('admin_enqueue_scripts', 'handoff_load_custom_wp_admin_style');\n");
    // #region core/button styles
    // function handoff_custom_style()
    // {
    //   echo "<style>${styles.join('\r\n')}</style>";
    // }
    // add_action('wp_head', 'handoff_custom_style', 100);
    // #endregion core/button styles
    //#endregion functions.php
    return [
        {
            filename: 'theme.json',
            data: data,
        },
        {
            filename: 'functions.php',
            data: functionsFileContents,
        },
        {
            filename: 'handoff.css',
            data: styles.join('\r\n'),
        }
    ];
};
exports.postWordPressIntegration = postWordPressIntegration;
var getWordPressThemeObject = function () {
    return {
        $schema: "https://schemas.wp.org/trunk/theme.json",
        version: 2,
        settings: {
            color: {
                palette: [],
                gradients: []
            },
            typography: {
                fontFamilies: [],
                fontSizes: [],
            },
            blocks: {
                'core/button': {
                    custom: {},
                    typography: {
                        customFontSize: false,
                    },
                    border: {
                        color: false,
                        radius: false,
                        style: false,
                        width: false,
                    },
                    color: {
                        text: false,
                        background: false,
                        palette: [],
                    },
                }
            }
        },
        styles: {
            blocks: {
                'core/button': {
                    variations: {},
                },
            },
            typography: {
                fontFamily: "var(--wp--preset--font-family--inter)",
                fontSize: "var(--wp--preset--font-size--paragraph)",
            },
            elements: {
                button: {},
                h1: {},
                h2: {},
                h3: {},
                h4: {},
                h5: {},
                h6: {}
            }
        }
    };
};
var getButtonTypeStyles = function (buttons, type) {
    var btnsOfType = buttons.filter(function (btn) { return btn.type === type; });
    var defaultButton = btnsOfType.filter(function (btn) { return btn.state === 'default'; })[0];
    var hoverButton = btnsOfType.filter(function (btn) { return btn.state === 'hover'; })[0];
    return {
        border: {
            radius: "".concat(defaultButton.values.borderRadius, "px"),
            width: "".concat(defaultButton.values.borderWeight, "px"),
        },
        color: {
            background: defaultButton.values.backgroundColor,
            text: defaultButton.values.color,
        },
        spacing: {
            padding: {
                top: "".concat(defaultButton.values.paddingTop, "px"),
                right: "".concat(defaultButton.values.paddingRight, "px"),
                bottom: "".concat(defaultButton.values.paddingBottom, "px"),
                left: "".concat(defaultButton.values.paddingLeft, "px"),
            }
        },
        typography: {
            fontSize: "".concat(defaultButton.values.fontSize, "px"),
            fontWeight: "".concat(defaultButton.values.fontWeight),
        },
        ":hover": {
            color: {
                background: hoverButton.values.backgroundColor,
                text: hoverButton.values.color,
            },
            typography: {
                textDecoration: hoverButton.values.textDecoration.toLowerCase(),
            }
        }
    };
};
