'use strict';

require('dotenv/config');
var path = require('path');
var fs = require('fs-extra');
var stream = require('node:stream');
var documentationObject = require('./documentation-object-6b3083b8.cjs.prod.js');
var capitalize = require('lodash/capitalize');
var lodash = require('lodash');
var Mustache = require('mustache');
var nodeHtmlParser = require('node-html-parser');
var webpack = require('webpack');
var chalk = require('chalk');
var archiver = require('archiver');
var sortedUniq = require('lodash/sortedUniq');
require('lodash/isEqual');
require('axios');
require('lodash/uniq');

function _interopDefault (e) { return e && e.__esModule ? e : { 'default': e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var path__default = /*#__PURE__*/_interopDefault(path);
var fs__namespace = /*#__PURE__*/_interopNamespace(fs);
var stream__namespace = /*#__PURE__*/_interopNamespace(stream);
var capitalize__default = /*#__PURE__*/_interopDefault(capitalize);
var Mustache__default = /*#__PURE__*/_interopDefault(Mustache);
var webpack__default = /*#__PURE__*/_interopDefault(webpack);
var chalk__default = /*#__PURE__*/_interopDefault(chalk);
var archiver__default = /*#__PURE__*/_interopDefault(archiver);
var sortedUniq__default = /*#__PURE__*/_interopDefault(sortedUniq);

const transformFigmaColorToCssColor = color => {
  const {
    r,
    g,
    b,
    a
  } = color;
  if (a === 1) {
    // transform to hex
    return documentationObject.transformFigmaColorToHex(color);
  }
  return `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`;
};
const getTypesFromComponents = components => {
  return Array.from(new Set(components.map(component => component.type).filter(documentationObject.filterOutUndefined)));
};
const getStatesFromComponents = components => {
  return Array.from(new Set(components.map(component => component.state).filter(documentationObject.filterOutUndefined)));
};
const getThemesFromComponents = components => {
  return Array.from(new Set(components.map(component => component.theme).filter(documentationObject.filterOutUndefined)));
};
const getSizesFromComponents = components => {
  return Array.from(new Set(components.map(component => component.size).filter(documentationObject.filterOutUndefined)));
};

/**
 * Generate a CSS comment block at the top of each record
 * @param type
 * @param component
 * @returns
 */
const cssCodeBlockComment = (type, component) => {
  let comment = `/* ${type} ${lodash.capitalize(component.componentType === 'design' ? component.type : component.size)} `;
  comment += component.componentType === 'design' && component.theme ? `, theme: ${lodash.capitalize(component.theme)}` : '';
  comment += component.componentType === 'design' && component.state ? `, state: ${lodash.capitalize(component.state)}` : '';
  return comment + '*/';
};

var Part$5;
/**
 * Generate a list of alert variants as an scss map
 * @param alerts
 * @returns
 */
(function (Part) {
  Part["Alert"] = "alert";
  Part["Close"] = "close";
  Part["Icon"] = "icon";
  Part["Body"] = "body";
  Part["Content"] = "content";
  Part["Title"] = "title";
  Part["Text"] = "text";
  Part["Actions"] = "actions";
})(Part$5 || (Part$5 = {}));
const transformAlertComponentsToScssTypes = alerts => {
  const lines = [];
  lines.push(`$alert-variants: ( ${getTypesFromComponents(alerts).map(type => `"${type}"`).join(', ')});`);
  return lines.join('\n\n') + '\n';
};
const transformAlertComponentTokensToScssVariables = tokens => {
  const type = tokens.componentType === 'design' ? tokens.type : tokens.layout;
  const theme = 'light';
  const state = 'default';
  return {
    /**
     * Main part
     */
    // Background
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: '',
      property: 'background',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background',
      group: Part$5.Alert
    },
    // Padding
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: '',
      property: 'padding-top',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top',
      group: Part$5.Alert
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: '',
      property: 'padding-right',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right',
      group: Part$5.Alert
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: '',
      property: 'padding-bottom',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom',
      group: Part$5.Alert
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: '',
      property: 'padding-left',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left',
      group: Part$5.Alert
    },
    // Border
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: '',
      property: 'border-width',
      theme,
      type,
      state
    })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width',
      group: Part$5.Alert
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: '',
      property: 'border-radius',
      theme,
      type,
      state
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius',
      group: Part$5.Alert
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: '',
      property: 'border-color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.borderColor).color,
      property: 'border-color',
      group: Part$5.Alert
    },
    // Box shadow
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: '',
      property: 'box-shadow',
      theme,
      type,
      state
    })]: {
      value: tokens.effects.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
      group: Part$5.Alert
    },
    // Spacing
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: '',
      property: 'spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.spacing}px`,
      property: 'spacing',
      group: Part$5.Alert
    },
    /**
     * Close part
     */
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'close',
      property: 'color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.close.color).color,
      property: 'color',
      group: Part$5.Close
    },
    /**
     * Icon part
     */
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'icon',
      property: 'color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.icon.color).color,
      property: 'color',
      group: Part$5.Icon
    },
    /**
     * Body part
     */
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'body',
      property: 'spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.body.spacing}px`,
      property: 'spacing',
      group: Part$5.Body
    },
    /**
     * Content part
     */
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'content',
      property: 'spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.content.spacing}px`,
      property: 'spacing',
      group: Part$5.Content
    },
    /**
     * Title part
     */
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'title',
      property: 'font-family',
      theme,
      type,
      state
    })]: {
      value: `'${tokens.parts.title.fontFamily}'`,
      property: 'font-family',
      group: Part$5.Title
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'title',
      property: 'font-size',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.title.fontSize}px`,
      property: 'font-size',
      group: Part$5.Title
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'title',
      property: 'font-weight',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.title.fontWeight}`,
      property: 'font-weight',
      group: Part$5.Title
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'title',
      property: 'line-height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.title.lineHeight}`,
      property: 'line-height',
      group: Part$5.Title
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'title',
      property: 'letter-spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.title.letterSpacing}px`,
      property: 'letter-spacing',
      group: Part$5.Title
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'title',
      property: 'text-align',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.title.textAlign),
      property: 'text-align',
      group: Part$5.Title
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'title',
      property: 'text-decoration',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.title.textDecoration),
      property: 'text-decoration',
      group: Part$5.Title
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'title',
      property: 'text-transform',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.title.textCase),
      property: 'text-transform',
      group: Part$5.Title
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'title',
      property: 'color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.title.color).color,
      property: 'color',
      group: Part$5.Title
    },
    /**
     * Text part
     */
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'text',
      property: 'font-family',
      theme,
      type,
      state
    })]: {
      value: `'${tokens.parts.text.fontFamily}'`,
      property: 'font-family',
      group: Part$5.Text
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'text',
      property: 'font-size',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.text.fontSize}px`,
      property: 'font-size',
      group: Part$5.Text
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'text',
      property: 'font-weight',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.text.fontWeight}`,
      property: 'font-weight',
      group: Part$5.Text
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'text',
      property: 'line-height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.text.lineHeight}`,
      property: 'line-height',
      group: Part$5.Text
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'text',
      property: 'letter-spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.text.letterSpacing}px`,
      property: 'letter-spacing',
      group: Part$5.Text
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'text',
      property: 'text-align',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.text.textAlign),
      property: 'text-align',
      group: Part$5.Text
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'text',
      property: 'text-decoration',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.text.textDecoration),
      property: 'text-decoration',
      group: Part$5.Text
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'text',
      property: 'text-transform',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.text.textCase),
      property: 'text-transform',
      group: Part$5.Text
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'text',
      property: 'color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.text.color).color,
      property: 'color',
      group: Part$5.Text
    },
    /**
     * Actions part
     */
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'actions',
      property: 'spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.actions.spacing}px`,
      property: 'margin-left',
      group: Part$5.Actions
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'actions',
      property: 'font-family',
      theme,
      type,
      state
    })]: {
      value: `'${tokens.parts.actions.fontFamily}'`,
      property: 'font-family',
      group: Part$5.Actions
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'actions',
      property: 'font-size',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.actions.fontSize}px`,
      property: 'font-size',
      group: Part$5.Actions
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'actions',
      property: 'font-weight',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.actions.fontWeight}`,
      property: 'font-weight',
      group: Part$5.Actions
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'actions',
      property: 'line-height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.actions.lineHeight}`,
      property: 'line-height',
      group: Part$5.Actions
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'actions',
      property: 'letter-spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.actions.letterSpacing}px`,
      property: 'letter-spacing',
      group: Part$5.Actions
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'actions',
      property: 'text-align',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.actions.textAlign),
      property: 'text-align',
      group: Part$5.Actions
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'actions',
      property: 'text-decoration',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.actions.textDecoration),
      property: 'text-decoration',
      group: Part$5.Actions
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'actions',
      property: 'text-transform',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.actions.textCase),
      property: 'text-transform',
      group: Part$5.Actions
    },
    [documentationObject.getScssVariableName({
      component: 'alert',
      part: 'actions',
      property: 'color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.actions.color).color,
      property: 'color',
      group: Part$5.Actions
    }
  };
};

var Part$4;
/**
 * Transform a button to an SCSS var
 * @param buttons
 * @returns
 */
(function (Part) {
  Part["Button"] = "button";
})(Part$4 || (Part$4 = {}));
const transformButtonComponentsToScssTypes = (buttons, config) => {
  const lines = [];
  lines.push(`$button-variants: ( ${getTypesFromComponents(buttons).map(type => `"${type}"`).join(', ')});`);
  lines.push(`$button-sizes: ( ${getSizesFromComponents(buttons).map(type => `"${documentationObject.mapComponentSize(type, 'button')}"`).join(', ')} );`);
  lines.push(`$button-themes: ( ${getThemesFromComponents(buttons).map(type => `"${type}"`).join(', ')} );`);
  lines.push(`$button-states: ( ${getStatesFromComponents(buttons).map(type => `"${type == 'default' ? '' : type}"`).join(', ')} );`);
  return lines.join('\n\n') + '\n';
};

/**
 * Transform button components into scss vars
 * @param tokens
 * @returns
 */
const transformButtonComponentTokensToScssVariables = tokens => {
  const type = tokens.componentType === 'design' ? tokens.type : documentationObject.mapComponentSize(tokens.size, 'button');
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;
  const state = tokens.componentType === 'design' ? tokens.state : undefined;
  return {
    // Background
    [documentationObject.getScssVariableName({
      component: 'button',
      part: '',
      property: 'background',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background',
      group: Part$4.Button
    },
    // Padding
    [documentationObject.getScssVariableName({
      component: 'button',
      part: '',
      property: 'padding-top',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top',
      group: Part$4.Button
    },
    [documentationObject.getScssVariableName({
      component: 'button',
      part: '',
      property: 'padding-right',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right',
      group: Part$4.Button
    },
    [documentationObject.getScssVariableName({
      component: 'button',
      part: '',
      property: 'padding-bottom',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom',
      group: Part$4.Button
    },
    [documentationObject.getScssVariableName({
      component: 'button',
      part: '',
      property: 'padding-left',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left',
      group: Part$4.Button
    },
    // Border
    [documentationObject.getScssVariableName({
      component: 'button',
      part: '',
      property: 'border-width',
      theme,
      type,
      state
    })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width',
      group: Part$4.Button
    },
    [documentationObject.getScssVariableName({
      component: 'button',
      part: '',
      property: 'border-radius',
      theme,
      type,
      state
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius',
      group: Part$4.Button
    },
    [documentationObject.getScssVariableName({
      component: 'button',
      part: '',
      property: 'border-color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.borderColor).color,
      property: 'border-color',
      group: Part$4.Button
    },
    // Font
    [documentationObject.getScssVariableName({
      component: 'button',
      part: '',
      property: 'font-family',
      theme,
      type,
      state
    })]: {
      value: `'${tokens.fontFamily}'`,
      property: 'font-family',
      group: Part$4.Button
    },
    [documentationObject.getScssVariableName({
      component: 'button',
      part: '',
      property: 'font-size',
      theme,
      type,
      state
    })]: {
      value: `${tokens.fontSize}px`,
      property: 'font-size',
      group: Part$4.Button
    },
    [documentationObject.getScssVariableName({
      component: 'button',
      part: '',
      property: 'font-weight',
      theme,
      type,
      state
    })]: {
      value: `${tokens.fontWeight}`,
      property: 'font-weight',
      group: Part$4.Button
    },
    [documentationObject.getScssVariableName({
      component: 'button',
      part: '',
      property: 'line-height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.lineHeight}`,
      property: 'line-height',
      group: Part$4.Button
    },
    [documentationObject.getScssVariableName({
      component: 'button',
      part: '',
      property: 'letter-spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.letterSpacing}px`,
      property: 'letter-spacing',
      group: Part$4.Button
    },
    [documentationObject.getScssVariableName({
      component: 'button',
      part: '',
      property: 'text-align',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.textAlign),
      property: 'text-align',
      group: Part$4.Button
    },
    [documentationObject.getScssVariableName({
      component: 'button',
      part: '',
      property: 'text-decoration',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.textDecoration),
      property: 'text-decoration',
      group: Part$4.Button
    },
    [documentationObject.getScssVariableName({
      component: 'button',
      part: '',
      property: 'text-transform',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.textCase),
      property: 'text-transform',
      group: Part$4.Button
    },
    [documentationObject.getScssVariableName({
      component: 'button',
      part: '',
      property: 'color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.color).color,
      property: 'color',
      group: Part$4.Button
    },
    // Box shadow
    [documentationObject.getScssVariableName({
      component: 'button',
      part: '',
      property: 'box-shadow',
      theme,
      type,
      state
    })]: {
      value: tokens.effects.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
      group: Part$4.Button
    },
    // Opacity
    [documentationObject.getScssVariableName({
      component: 'button',
      part: '',
      property: 'opacity',
      theme,
      type,
      state
    })]: {
      value: `${tokens.opacity}`,
      property: 'opacity',
      group: Part$4.Button
    }
  };
};

var Part$3;
/**
 * Generate variant maps fro checkbox components
 * @param checkboxes
 * @returns
 */
(function (Part) {
  Part["Checkbox"] = "checkbox";
  Part["Icon"] = "icon";
  Part["Label"] = "label";
})(Part$3 || (Part$3 = {}));
const transformCheckboxComponentsToScssTypes = checkboxes => {
  const lines = [];
  lines.push(`$checkbox-sizes: ( ${getSizesFromComponents(checkboxes).map(type => `"${documentationObject.mapComponentSize(type, 'checkbox')}"`).join(', ')} );`);
  lines.push(`$checkbox-themes: ( ${getThemesFromComponents(checkboxes).map(type => `"${type}"`).join(', ')} );`);
  lines.push(`$checkbox-states: ( ${getStatesFromComponents(checkboxes).map(type => `"${type == 'default' ? '' : type}"`).join(', ')} );`);
  return lines.join('\n\n') + '\n';
};
const transformCheckboxComponentTokensToScssVariables = tokens => {
  const type = tokens.componentType === 'design' ? tokens.state : documentationObject.mapComponentSize(tokens.size, 'checkbox');
  const theme = 'light';
  const state = tokens.componentType === 'design' ? tokens.activity : 'off';
  return {
    /**
     * Checkbox part
     */
    // Button background
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      part: '',
      property: 'background',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.check.background).color,
      property: 'background',
      group: Part$3.Checkbox
    },
    // Size
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      part: '',
      property: 'width',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.width ?? '0'}px`,
      property: 'width',
      group: Part$3.Checkbox
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      part: '',
      property: 'width-raw',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.width ?? '0'}`,
      property: 'width-raw',
      group: Part$3.Checkbox
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      part: '',
      property: 'height',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.height ?? '0'}px`,
      property: 'height',
      group: Part$3.Checkbox
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      part: '',
      property: 'height-raw',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.height ?? '0'}`,
      property: 'height-raw',
      group: Part$3.Checkbox
    },
    // Icon Color
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      property: 'icon-color',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.check.color).color,
      property: 'icon-color',
      group: Part$3.Checkbox
    },
    // Opacity
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      property: 'opacity',
      type,
      theme,
      state
    })]: {
      value: `${tokens.opacity}`,
      property: 'opacity',
      group: Part$3.Checkbox
    },
    // Padding
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      property: 'padding-y',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-vertical',
      group: Part$3.Checkbox
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      property: 'padding-x',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-horizontal',
      group: Part$3.Checkbox
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      property: 'padding-top',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top',
      group: Part$3.Checkbox
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      property: 'padding-right',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right',
      group: Part$3.Checkbox
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      property: 'padding-bottom',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom',
      group: Part$3.Checkbox
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      property: 'padding-left',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left',
      group: Part$3.Checkbox
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      property: 'padding-start',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.paddingLeft}px`,
      property: 'padding-start',
      group: Part$3.Checkbox
    },
    // Border
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      property: 'border-width',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.borderWeight}px`,
      property: 'border-width',
      group: Part$3.Checkbox
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      property: 'border-radius',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.borderRadius}px`,
      property: 'border-radius',
      group: Part$3.Checkbox
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      property: 'border-color',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.check.borderColor).color,
      property: 'border-color',
      group: Part$3.Checkbox
    },
    // Box shadow
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      property: 'box-shadow',
      type,
      theme,
      state
    })]: {
      value: tokens.parts.check.effects.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
      group: Part$3.Checkbox
    },
    /**
     * Icon part
     */
    // Size
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      part: 'icon',
      property: 'width',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.icon.width ?? '0'}px`,
      property: 'width',
      group: Part$3.Icon
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      part: 'icon',
      property: 'width-raw',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.icon.width ?? '0'}`,
      property: 'width-raw',
      group: Part$3.Icon
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      part: 'icon',
      property: 'height',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.icon.height ?? '0'}px`,
      property: 'height',
      group: Part$3.Icon
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      part: 'icon',
      property: 'height-raw',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.icon.height ?? '0'}`,
      property: 'height-raw',
      group: Part$3.Icon
    },
    /**
     * Label part
     */
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      part: 'label',
      property: 'spacing',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'spacing',
      group: Part$3.Label
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      part: 'label',
      property: 'font-family',
      type,
      theme,
      state
    })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font-family',
      group: Part$3.Label
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      part: 'label',
      property: 'font-size',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font-size',
      group: Part$3.Label
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      part: 'label',
      property: 'font-weight',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font-weight',
      group: Part$3.Label
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      part: 'label',
      property: 'line-height',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line-height',
      group: Part$3.Label
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      part: 'label',
      property: 'letter-spacing',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter-spacing',
      group: Part$3.Label
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      part: 'label',
      property: 'text-align',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text-align',
      group: Part$3.Label
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      part: 'label',
      property: 'text-decoration',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text-decoration',
      group: Part$3.Label
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      part: 'label',
      property: 'text-transform',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.label.textCase),
      property: 'text-transform',
      group: Part$3.Label
    },
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      part: 'label',
      property: 'color',
      type,
      theme,
      state
    })]: {
      value: transformFigmaColorToCssColor(tokens.parts.label.color),
      property: 'color',
      group: Part$3.Label
    },
    // Opacity
    [documentationObject.getScssVariableName({
      component: 'checkbox',
      part: 'label',
      property: 'opacity',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.opacity}`,
      property: 'opacity',
      group: Part$3.Label
    }
  };
};

var Part$2;
/**
 * Generate variant maps from input components
 * @param inputs
 * @returns
 */
(function (Part) {
  Part["Input"] = "input";
  Part["Icon"] = "icon";
  Part["Label"] = "label";
  Part["AdditionalInfo"] = "additional-info";
})(Part$2 || (Part$2 = {}));
const transformInputComponentsToScssTypes = inputs => {
  const lines = [];
  lines.push(`$input-sizes: ( ${getSizesFromComponents(inputs).map(type => `"${documentationObject.mapComponentSize(type, 'input')}"`).join(', ')} );`);
  lines.push(`$input-themes: ( ${getThemesFromComponents(inputs).map(type => `"${type}"`).join(', ')} );`);
  lines.push(`$input-states: ( ${getStatesFromComponents(inputs).map(type => `"${type == 'default' ? '' : type}"`).join(', ')} );`);
  return lines.join('\n\n') + '\n';
};
const transformInputComponentTokensToScssVariables = tokens => {
  const type = tokens.componentType === 'design' ? undefined : documentationObject.mapComponentSize(tokens.size, 'input');
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;
  const state = tokens.componentType === 'design' ? tokens.state : undefined;
  return {
    /**
     * Main part
     */
    // Background
    [documentationObject.getScssVariableName({
      component: 'input',
      property: 'background',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background-color',
      group: Part$2.Input
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      property: 'bg',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background-color',
      group: Part$2.Input
    },
    // Padding
    [documentationObject.getScssVariableName({
      component: 'input',
      property: 'padding-y',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-y',
      group: Part$2.Input
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      property: 'padding-x',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-x',
      group: Part$2.Input
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      property: 'padding-top',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top',
      group: Part$2.Input
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      property: 'padding-right',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right',
      group: Part$2.Input
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      property: 'padding-bottom',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom',
      group: Part$2.Input
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      property: 'padding-left',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left',
      group: Part$2.Input
    },
    // Border
    [documentationObject.getScssVariableName({
      component: 'input',
      property: 'border-width',
      type,
      theme,
      state
    })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width',
      group: Part$2.Input
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      property: 'border-radius',
      type,
      theme,
      state
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius',
      group: Part$2.Input
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      property: 'border-color',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.borderColor).color,
      property: 'border-color',
      group: Part$2.Input
    },
    // Font
    [documentationObject.getScssVariableName({
      component: 'input',
      property: 'font-family',
      type,
      theme,
      state
    })]: {
      value: `'${tokens.parts.text.fontFamily}'`,
      property: 'font-family',
      group: Part$2.Input
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      property: 'font-size',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.text.fontSize}px`,
      property: 'font-size',
      group: Part$2.Input
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      property: 'font-weight',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.text.fontWeight}`,
      property: 'font-weight',
      group: Part$2.Input
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      property: 'line-height',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.text.lineHeight}`,
      property: 'line-height',
      group: Part$2.Input
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      property: 'letter-spacing',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.text.letterSpacing}px`,
      property: 'letter-spacing',
      group: Part$2.Input
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      property: 'text-align',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.text.textAlign),
      property: 'text-align',
      group: Part$2.Input
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      property: 'text-decoration',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.text.textDecoration),
      property: 'text-decoration',
      group: Part$2.Input
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      property: 'text-transform',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.text.textCase),
      property: 'text-transformation',
      group: Part$2.Input
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      property: 'color',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaColorToCssColor(tokens.parts.text.color),
      property: 'color',
      group: Part$2.Input
    },
    // Box shadow
    [documentationObject.getScssVariableName({
      component: 'input',
      property: 'box-shadow',
      type,
      theme,
      state
    })]: {
      value: tokens.effects.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
      group: Part$2.Input
    },
    /**
     * Label part
     */
    [documentationObject.getScssVariableName({
      component: 'input',
      part: 'label',
      property: 'spacing',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.spacing}px`,
      property: 'spacing',
      group: Part$2.Label
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      part: 'label',
      property: 'font-family',
      type,
      theme,
      state
    })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font-family',
      group: Part$2.Label
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      part: 'label',
      property: 'font-size',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font-size',
      group: Part$2.Label
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      part: 'label',
      property: 'font-weight',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font-weight',
      group: Part$2.Label
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      part: 'label',
      property: 'line-height',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line-height',
      group: Part$2.Label
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      part: 'label',
      property: 'letter-spacing',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter-spacing',
      group: Part$2.Label
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      part: 'label',
      property: 'text-align',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text-alignment',
      group: Part$2.Label
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      part: 'label',
      property: 'text-decoration',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text-decoration',
      group: Part$2.Label
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      part: 'label',
      property: 'text-transform',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.label.textCase),
      property: 'text-transformation',
      group: Part$2.Label
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      part: 'label',
      property: 'color',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaColorToCssColor(tokens.parts.label.color),
      property: 'color',
      group: Part$2.Label
    },
    /**
     * Icon part
     */
    [documentationObject.getScssVariableName({
      component: 'input',
      part: 'icon',
      property: 'border-width',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.icon.borderWeight}px`,
      property: 'border-width',
      group: Part$2.Icon
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      part: 'icon',
      property: 'border-color',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaColorToCssColor(tokens.parts.icon.borderColor),
      property: 'border-color',
      group: Part$2.Icon
    },
    /**
     * Additional info part
     */
    [documentationObject.getScssVariableName({
      component: 'input',
      part: 'additional-info',
      property: 'spacing',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.additionalInfo.spacing}px`,
      property: 'spacing',
      group: Part$2.AdditionalInfo
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      part: 'additional-info',
      property: 'font-family',
      type,
      theme,
      state
    })]: {
      value: `'${tokens.parts.additionalInfo.fontFamily}'`,
      property: 'font-family',
      group: Part$2.AdditionalInfo
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      part: 'additional-info',
      property: 'font-size',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.additionalInfo.fontSize}px`,
      property: 'font-size',
      group: Part$2.AdditionalInfo
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      part: 'additional-info',
      property: 'font-weight',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.additionalInfo.fontWeight}`,
      property: 'font-weight',
      group: Part$2.AdditionalInfo
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      part: 'additional-info',
      property: 'line-height',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.additionalInfo.lineHeight}`,
      property: 'line-height',
      group: Part$2.AdditionalInfo
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      part: 'additional-info',
      property: 'letter-spacing',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.additionalInfo.letterSpacing}px`,
      property: 'letter-spacing',
      group: Part$2.AdditionalInfo
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      part: 'additional-info',
      property: 'text-align',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.additionalInfo.textAlign),
      property: 'text-align',
      group: Part$2.AdditionalInfo
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      part: 'additional-info',
      property: 'text-decoration',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.additionalInfo.textDecoration),
      property: 'text-decoration',
      group: Part$2.AdditionalInfo
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      part: 'additional-info',
      property: 'text-transform',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.additionalInfo.textCase),
      property: 'text-transform',
      group: Part$2.AdditionalInfo
    },
    [documentationObject.getScssVariableName({
      component: 'input',
      part: 'additional-info',
      property: 'color',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaColorToCssColor(tokens.parts.additionalInfo.color),
      property: 'color',
      group: Part$2.AdditionalInfo
    }
  };
};

var Parts$3;
(function (Parts) {
  Parts["Modal"] = "modal";
  Parts["Header"] = "header";
  Parts["Title"] = "title";
  Parts["Body"] = "body";
  Parts["Footer"] = "footer";
})(Parts$3 || (Parts$3 = {}));
const transformModalComponentsToScssTypes = modals => {
  const lines = [];
  lines.push(`/* At present there are no modal types*/`);
  return lines.join('\n\n') + '\n';
};

/**
 * Generate Modal SCSS vars from Modal Tokens
 * @param param0
 * @returns
 */
const transformModalComponentTokensToScssVariables = ({
  ...tokens
}) => {
  const type = tokens.componentType === 'design' ? tokens.type : documentationObject.mapComponentSize(tokens.size, 'modal');
  return {
    /**
     * Main part
     */
    // Background
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: '',
      property: 'background',
      type
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background',
      group: Parts$3.Modal
    },
    // Padding
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: '',
      property: 'padding-y',
      type
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-y',
      group: Parts$3.Modal
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: '',
      property: 'padding-x',
      type
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-x',
      group: Parts$3.Modal
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: '',
      property: 'padding-top',
      type
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top',
      group: Parts$3.Modal
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: '',
      property: 'padding-right',
      type
    })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right',
      group: Parts$3.Modal
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: '',
      property: 'padding-bottom',
      type
    })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom',
      group: Parts$3.Modal
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: '',
      property: 'padding-left',
      type
    })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left',
      group: Parts$3.Modal
    },
    // Border
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: '',
      property: 'border-width',
      type
    })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width',
      group: Parts$3.Modal
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: '',
      property: 'border-radius',
      type
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius',
      group: Parts$3.Modal
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: '',
      property: 'border-radius-sm',
      type
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius-sm',
      group: Parts$3.Modal
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: '',
      property: 'border-radius-lg',
      type
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius-lg',
      group: Parts$3.Modal
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: '',
      property: 'border-color',
      type
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.borderColor).color,
      property: 'border-color',
      group: Parts$3.Modal
    },
    // Box shadow
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: '',
      property: 'box-shadow',
      type
    })]: {
      value: tokens.effects.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
      group: Parts$3.Modal
    },
    /**
     * Header part
     */
    // Background
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'header',
      property: 'background',
      type
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.header.background).color,
      property: 'background',
      group: Parts$3.Header
    },
    // Padding
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'header',
      property: 'padding-y',
      type
    })]: {
      value: `${tokens.parts.header.paddingTop}px`,
      property: 'padding-y',
      group: Parts$3.Header
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'header',
      property: 'padding-x',
      type
    })]: {
      value: `${tokens.parts.header.paddingTop}px`,
      property: 'padding-x',
      group: Parts$3.Header
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'header',
      property: 'padding-top',
      type
    })]: {
      value: `${tokens.parts.header.paddingTop}px`,
      property: 'padding-top',
      group: Parts$3.Header
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'header',
      property: 'padding-right',
      type
    })]: {
      value: `${tokens.parts.header.paddingRight}px`,
      property: 'padding-right',
      group: Parts$3.Header
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'header',
      property: 'padding-bottom',
      type
    })]: {
      value: `${tokens.parts.header.paddingBottom}px`,
      property: 'padding-bottom',
      group: Parts$3.Header
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'header',
      property: 'padding-left',
      type
    })]: {
      value: `${tokens.parts.header.paddingLeft}px`,
      property: 'padding-left',
      group: Parts$3.Header
    },
    // Border
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'header',
      property: 'border-width',
      type
    })]: {
      value: `${tokens.parts.header.borderWeight}px`,
      property: 'border-width',
      group: Parts$3.Header
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'header',
      property: 'border-radius',
      type
    })]: {
      value: `${tokens.parts.header.borderRadius}px`,
      property: 'border-radius',
      group: Parts$3.Header
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'header',
      property: 'border-radius-sm',
      type
    })]: {
      value: `${tokens.parts.header.borderRadius}px`,
      property: 'border-radius-sm',
      group: Parts$3.Header
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'header',
      property: 'border-radius-lg',
      type
    })]: {
      value: `${tokens.parts.header.borderRadius}px`,
      property: 'border-radius-lg',
      group: Parts$3.Header
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'header',
      property: 'border-color',
      type
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.header.borderColor).color,
      property: 'border-color',
      group: Parts$3.Header
    },
    // Box shadow
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'header',
      property: 'box-shadow',
      type
    })]: {
      value: tokens.parts.header.effects.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
      group: Parts$3.Header
    },
    /**
     * Title part
     */
    // Font
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'title',
      property: 'font-family',
      type
    })]: {
      value: `'${tokens.parts.header.title.fontFamily}'`,
      property: 'font-family',
      group: Parts$3.Title
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'title',
      property: 'font-size',
      type
    })]: {
      value: `${tokens.parts.header.title.fontSize}px`,
      property: 'font-size',
      group: Parts$3.Title
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'title',
      property: 'font-weight',
      type
    })]: {
      value: `${tokens.parts.header.title.fontWeight}`,
      property: 'font-weight',
      group: Parts$3.Title
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'title',
      property: 'line-height',
      type
    })]: {
      value: `${tokens.parts.header.title.lineHeight}`,
      property: 'line-height',
      group: Parts$3.Title
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'title',
      property: 'letter-spacing',
      type
    })]: {
      value: `${tokens.parts.header.title.letterSpacing}px`,
      property: 'letter-spacing',
      group: Parts$3.Title
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'title',
      property: 'text-align',
      type
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.header.title.textAlign),
      property: 'text-align',
      group: Parts$3.Title
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'title',
      property: 'text-decoration',
      type
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.header.title.textDecoration),
      property: 'text-decoration',
      group: Parts$3.Title
    },
    /**
     * Body part
     */
    // Background
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'body',
      property: 'background',
      type
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.body.background).color,
      property: 'background',
      group: Parts$3.Body
    },
    // Padding
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'body',
      property: 'padding-y',
      type
    })]: {
      value: `${tokens.parts.body.paddingTop}px`,
      property: 'padding-y',
      group: Parts$3.Body
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'body',
      property: 'padding-x',
      type
    })]: {
      value: `${tokens.parts.body.paddingTop}px`,
      property: 'padding-x',
      group: Parts$3.Body
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'body',
      property: 'padding-top',
      type
    })]: {
      value: `${tokens.parts.body.paddingTop}px`,
      property: 'padding-top',
      group: Parts$3.Body
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'body',
      property: 'padding-right',
      type
    })]: {
      value: `${tokens.parts.body.paddingRight}px`,
      property: 'padding-right',
      group: Parts$3.Body
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'body',
      property: 'padding-bottom',
      type
    })]: {
      value: `${tokens.parts.body.paddingBottom}px`,
      property: 'padding-bottom',
      group: Parts$3.Body
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'body',
      property: 'padding-left',
      type
    })]: {
      value: `${tokens.parts.body.paddingLeft}px`,
      property: 'padding-left',
      group: Parts$3.Body
    },
    // Border
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'body',
      property: 'border-width',
      type
    })]: {
      value: `${tokens.parts.body.borderWeight}px`,
      property: 'border-width',
      group: Parts$3.Body
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'body',
      property: 'border-radius',
      type
    })]: {
      value: `${tokens.parts.body.borderRadius}px`,
      property: 'border-radius',
      group: Parts$3.Body
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'body',
      property: 'border-radius-sm',
      type
    })]: {
      value: `${tokens.parts.body.borderRadius}px`,
      property: 'border-radius-sm',
      group: Parts$3.Body
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'body',
      property: 'border-radius-lg',
      type
    })]: {
      value: `${tokens.parts.body.borderRadius}px`,
      property: 'border-radius-lg',
      group: Parts$3.Body
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'body',
      property: 'border-color',
      type
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.body.borderColor).color,
      property: 'border-color',
      group: Parts$3.Body
    },
    // Box shadow
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'body',
      property: 'box-shadow',
      type
    })]: {
      value: tokens.parts.body.effects.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
      group: Parts$3.Body
    },
    // Font
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'body',
      property: 'font-family',
      type
    })]: {
      value: `'${tokens.parts.body.content.fontFamily}'`,
      property: 'font-family',
      group: Parts$3.Body
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'body',
      property: 'font-size',
      type
    })]: {
      value: `${tokens.parts.body.content.fontSize}px`,
      property: 'font-size',
      group: Parts$3.Body
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'body',
      property: 'font-weight',
      type
    })]: {
      value: `${tokens.parts.body.content.fontWeight}`,
      property: 'font-weight',
      group: Parts$3.Body
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'body',
      property: 'line-height',
      type
    })]: {
      value: `${tokens.parts.body.content.lineHeight}`,
      property: 'line-height',
      group: Parts$3.Body
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'body',
      property: 'letter-spacing',
      type
    })]: {
      value: `${tokens.parts.body.content.letterSpacing}px`,
      property: 'letter-spacing',
      group: Parts$3.Body
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'body',
      property: 'text-align',
      type
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.body.content.textAlign),
      property: 'text-align',
      group: Parts$3.Body
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'body',
      property: 'text-decoration',
      type
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.body.content.textDecoration),
      property: 'text-decoration',
      group: Parts$3.Body
    },
    /**
     * Footer part
     */
    // Background
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'background',
      type
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.footer.background).color,
      property: 'background',
      group: Parts$3.Footer
    },
    // Padding
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'padding-y',
      type
    })]: {
      value: `${tokens.parts.footer.paddingTop}px`,
      property: 'padding-y',
      group: Parts$3.Footer
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'padding-x',
      type
    })]: {
      value: `${tokens.parts.footer.paddingTop}px`,
      property: 'padding-x',
      group: Parts$3.Footer
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'padding-top',
      type
    })]: {
      value: `${tokens.parts.footer.paddingTop}px`,
      property: 'padding-top',
      group: Parts$3.Footer
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'padding-right',
      type
    })]: {
      value: `${tokens.parts.footer.paddingRight}px`,
      property: 'padding-right',
      group: Parts$3.Footer
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'padding-bottom',
      type
    })]: {
      value: `${tokens.parts.footer.paddingBottom}px`,
      property: 'padding-bottom',
      group: Parts$3.Footer
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'padding-left',
      type
    })]: {
      value: `${tokens.parts.footer.paddingLeft}px`,
      property: 'padding-left',
      group: Parts$3.Footer
    },
    // Border
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'border-width',
      type
    })]: {
      value: `${tokens.parts.footer.borderWeight}px`,
      property: 'border-width',
      group: Parts$3.Footer
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'border-radius',
      type
    })]: {
      value: `${tokens.parts.footer.borderRadius}px`,
      property: 'border-radius',
      group: Parts$3.Footer
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'border-radius-sm',
      type
    })]: {
      value: `${tokens.parts.footer.borderRadius}px`,
      property: 'border-radius-sm',
      group: Parts$3.Footer
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'border-radius-lg',
      type
    })]: {
      value: `${tokens.parts.footer.borderRadius}px`,
      property: 'border-radius-lg',
      group: Parts$3.Footer
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'border-color',
      type
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.footer.borderColor).color,
      property: 'border-color',
      group: Parts$3.Footer
    },
    // Box shadow
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'box-shadow',
      type
    })]: {
      value: tokens.parts.footer.effects.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
      group: Parts$3.Footer
    },
    // Font
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'font-family',
      type
    })]: {
      value: `'${tokens.parts.footer.copy.fontFamily}'`,
      property: 'font-family',
      group: Parts$3.Footer
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'font-size',
      type
    })]: {
      value: `${tokens.parts.footer.copy.fontSize}px`,
      property: 'font-size',
      group: Parts$3.Footer
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'font-weight',
      type
    })]: {
      value: `${tokens.parts.footer.copy.fontWeight}`,
      property: 'font-weight',
      group: Parts$3.Footer
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'line-height',
      type
    })]: {
      value: `${tokens.parts.footer.copy.lineHeight}`,
      property: 'line-height',
      group: Parts$3.Footer
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'letter-spacing',
      type
    })]: {
      value: `${tokens.parts.footer.copy.letterSpacing}px`,
      property: 'letter-spacing',
      group: Parts$3.Footer
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'text-align',
      type
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.footer.copy.textAlign),
      property: 'text-align',
      group: Parts$3.Footer
    },
    [documentationObject.getScssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'text-decoration',
      type
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.footer.copy.textDecoration),
      property: 'text-decoration',
      group: Parts$3.Footer
    }
  };
};

/**
 * Generate SCSS variants from pagination component
 * @param pagination
 * @returns
 */
const transformPaginationComponentsToScssTypes = pagination => {
  const lines = [];
  lines.push(`$pagination-sizes: ( ${getSizesFromComponents(pagination).map(type => `"${type}"`).join(', ')} );`);
  lines.push(`$pagination-themes: ( ${getThemesFromComponents(pagination).map(type => `"${type}"`).join(', ')} );`);
  lines.push(`$pagination-states: ( ${getStatesFromComponents(pagination).map(type => `"${type == 'default' ? '' : type}"`).join(', ')} );`);
  return lines.join('\n\n') + '\n';
};
const transformPaginationComponentTokensToScssVariables = tokens => {
  const type = tokens.componentType === 'design' ? 'default' : documentationObject.mapComponentSize(tokens.size, 'pagination');
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;
  const state = tokens.componentType === 'design' ? tokens.state : undefined;
  return {
    // Background
    [documentationObject.getScssVariableName({
      component: 'pagination',
      property: 'background',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background'
    },
    // Border
    [documentationObject.getScssVariableName({
      component: 'pagination',
      property: 'border-width',
      theme,
      type,
      state
    })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      property: 'border-radius',
      theme,
      type,
      state
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      property: 'border-color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.borderColor).color,
      property: 'border-color'
    },
    // Spacing
    [documentationObject.getScssVariableName({
      component: 'pagination',
      property: 'spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.spacing}px`,
      property: 'spacing'
    },
    // Previous part
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'background',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.previous.background).color,
      property: 'background'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'border-width',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.previous.borderWeight}px`,
      property: 'border-width'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'border-radius',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.previous.borderRadius}px`,
      property: 'border-radius'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'border-color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.previous.borderColor).color,
      property: 'border-color'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'padding-top',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.previous.paddingTop}px`,
      property: 'padding-top'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'padding-right',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.previous.paddingRight}px`,
      property: 'padding-right'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'padding-bottom',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.previous.paddingBottom}px`,
      property: 'padding-bottom'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'padding-left',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.previous.paddingLeft}px`,
      property: 'padding-left'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'font-family',
      theme,
      type,
      state
    })]: {
      value: `'${tokens.parts.previous.fontFamily}'`,
      property: 'font-family'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'font-size',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.previous.fontSize}px`,
      property: 'font-size'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'font-weight',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.previous.fontWeight}`,
      property: 'font-weight'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'line-height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.previous.lineHeight}`,
      property: 'line-height'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'letter-spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.previous.letterSpacing}px`,
      property: 'letter-spacing'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'text-align',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.previous.textAlign),
      property: 'text-align'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'text-transform',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.previous.textCase),
      property: 'text-transform'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'text-decoration',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.previous.textDecoration),
      property: 'text-decoration'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.previous.color).color,
      property: 'color'
    },
    // Next part
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'background',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.next.background).color,
      property: 'background'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'border-width',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.next.borderWeight}px`,
      property: 'border-width'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'border-radius',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.next.borderRadius}px`,
      property: 'border-radius'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'border-color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.next.borderColor).color,
      property: 'border-color'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'padding-top',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.next.paddingTop}px`,
      property: 'padding-top'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'padding-right',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.next.paddingRight}px`,
      property: 'padding-right'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'padding-bottom',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.next.paddingBottom}px`,
      property: 'padding-bottom'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'padding-left',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.next.paddingLeft}px`,
      property: 'padding-left'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'font-family',
      theme,
      type,
      state
    })]: {
      value: `'${tokens.parts.next.fontFamily}'`,
      property: 'font-family'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'font-size',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.next.fontSize}px`,
      property: 'font-size'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'font-weight',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.next.fontWeight}`,
      property: 'font-weight'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'line-height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.next.lineHeight}`,
      property: 'line-height'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'letter-spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.next.letterSpacing}px`,
      property: 'letter-spacing'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'text-align',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.next.textAlign),
      property: 'text-align'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'text-transform',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.next.textCase),
      property: 'text-transform'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'text-decoration',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.next.textDecoration),
      property: 'text-decoration'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.next.color).color,
      property: 'color'
    },
    // Item part
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'background',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.item.background).color,
      property: 'background'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'border-width',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.item.borderWeight}px`,
      property: 'border-width'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'border-radius',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.item.borderRadius}px`,
      property: 'border-radius'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'border-color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.item.borderColor).color,
      property: 'border-color'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'padding-top',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.item.paddingTop}px`,
      property: 'padding-top'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'padding-right',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.item.paddingRight}px`,
      property: 'padding-right'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'padding-bottom',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.item.paddingBottom}px`,
      property: 'padding-bottom'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'padding-left',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.item.paddingLeft}px`,
      property: 'padding-left'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'font-family',
      theme,
      type,
      state
    })]: {
      value: `'${tokens.parts.item.fontFamily}'`,
      property: 'font-family'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'font-size',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.item.fontSize}px`,
      property: 'font-size'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'font-weight',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.item.fontWeight}`,
      property: 'font-weight'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'line-height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.item.lineHeight}`,
      property: 'line-height'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'letter-spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.item.letterSpacing}px`,
      property: 'letter-spacing'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'text-align',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.item.textAlign),
      property: 'text-align'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'text-transform',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.item.textCase),
      property: 'text-transform'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'text-decoration',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.item.textDecoration),
      property: 'text-decoration'
    },
    [documentationObject.getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.item.color).color,
      property: 'color'
    }
  };
};

var Parts$2;
/**
 * Build a list of SCSS variants from radio components
 * @param radios
 * @returns
 */
(function (Parts) {
  Parts["Radio"] = "radio";
  Parts["Label"] = "label";
  Parts["Thumb"] = "thumb";
})(Parts$2 || (Parts$2 = {}));
const transformRadioComponentsToScssTypes = radios => {
  const lines = [];
  lines.push(`$radio-sizes: ( ${getSizesFromComponents(radios).map(type => `"${documentationObject.mapComponentSize(type, 'radio')}"`).join(', ')} );`);
  lines.push(`$radio-themes: ( ${getThemesFromComponents(radios).map(type => `"${type}"`).join(', ')} );`);
  lines.push(`$radio-states: ( ${getStatesFromComponents(radios).map(type => `"${type == 'default' ? '' : type}"`).join(', ')} );`);
  return lines.join('\n\n') + '\n';
};

/**
 * Build SCSS tokens from radio
 * @param tokens
 * @returns
 */
const transformRadioComponentTokensToScssVariables = tokens => {
  const type = tokens.componentType === 'design' ? tokens.state : documentationObject.mapComponentSize(tokens.size, 'radio');
  const theme = 'light';
  const state = tokens.componentType === 'design' ? tokens.activity : 'off';
  return {
    /**
     * Main part
     */
    // Button background
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: '',
      property: 'background',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.check.background).color,
      property: 'background',
      group: Parts$2.Radio
    },
    // Size
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: '',
      property: 'width',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.width ?? '0'}px`,
      property: 'width',
      group: Parts$2.Radio
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: '',
      property: 'width-raw',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.width ?? '0'}`,
      property: 'width-raw',
      group: Parts$2.Radio
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: '',
      property: 'height',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.height ?? '0'}px`,
      property: 'height',
      group: Parts$2.Radio
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: '',
      property: 'height-raw',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.height ?? '0'}`,
      property: 'height-raw',
      group: Parts$2.Radio
    },
    // Padding
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: '',
      property: 'padding-y',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-y',
      group: Parts$2.Radio
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: '',
      property: 'padding-x',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-x',
      group: Parts$2.Radio
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: '',
      property: 'padding-top',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top',
      group: Parts$2.Radio
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: '',
      property: 'padding-right',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right',
      group: Parts$2.Radio
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: '',
      property: 'padding-bottom',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom',
      group: Parts$2.Radio
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: '',
      property: 'padding-left',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left',
      group: Parts$2.Radio
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: '',
      property: 'padding-start',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.paddingLeft}px`,
      property: 'padding-start',
      group: Parts$2.Radio
    },
    // Border
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: '',
      property: 'border-width',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.borderWeight}px`,
      property: 'border-width',
      group: Parts$2.Radio
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      property: 'border-radius',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.borderRadius}px`,
      property: 'border-radius',
      group: Parts$2.Radio
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      property: 'border-color',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.check.borderColor).color,
      property: 'border-color',
      group: Parts$2.Radio
    },
    // Opacity
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: '',
      property: 'opacity',
      type,
      theme,
      state
    })]: {
      value: `${tokens.opacity}`,
      property: 'opacity',
      group: Parts$2.Radio
    },
    // Box shadow
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: '',
      property: 'box-shadow',
      type,
      theme,
      state
    })]: {
      value: tokens.parts.check.effects.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
      group: Parts$2.Radio
    },
    /**
     * Label part
     */
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: 'label',
      property: 'spacing',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'spacing',
      group: Parts$2.Label
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: 'label',
      property: 'font-family',
      type,
      theme,
      state
    })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font-family',
      group: Parts$2.Label
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: 'label',
      property: 'font-size',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font-size',
      group: Parts$2.Label
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: 'label',
      property: 'font-weight',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font-weight',
      group: Parts$2.Label
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: 'label',
      property: 'line-height',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line-height',
      group: Parts$2.Label
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: 'label',
      property: 'letter-spacing',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter-spacing',
      group: Parts$2.Label
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: 'label',
      property: 'text-align',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text-align',
      group: Parts$2.Label
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: 'label',
      property: 'text-decoration',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text-decoration',
      group: Parts$2.Label
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: 'label',
      property: 'text-transform',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.label.textCase),
      property: 'text-transformation',
      group: Parts$2.Label
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: 'label',
      property: 'color',
      type,
      theme,
      state
    })]: {
      value: transformFigmaColorToCssColor(tokens.parts.label.color),
      property: 'color',
      group: Parts$2.Label
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: 'label',
      property: 'opacity',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.opacity}`,
      property: 'opacity',
      group: Parts$2.Label
    },
    /**
     * Thumb part
     */
    // Size
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: 'thumb',
      property: 'width',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.thumb.width ?? '0'}px`,
      property: 'width',
      group: Parts$2.Thumb
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: 'thumb',
      property: 'width-raw',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.thumb.width ?? '0'}`,
      property: 'width-raw',
      group: Parts$2.Thumb
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: 'thumb',
      property: 'height',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.thumb.height ?? '0'}px`,
      property: 'height',
      group: Parts$2.Thumb
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: 'thumb',
      property: 'height-raw',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.thumb.height ?? '0'}`,
      property: 'height-raw',
      group: Parts$2.Thumb
    },
    // Background
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: 'thumb',
      property: 'background',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.thumb.background).color,
      property: 'background',
      group: Parts$2.Thumb
    },
    // Border
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: 'thumb',
      property: 'border-width',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.thumb.borderWeight}px`,
      property: 'border-width',
      group: Parts$2.Thumb
    },
    [documentationObject.getScssVariableName({
      component: 'radio',
      part: 'thumb',
      property: 'border-color',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.thumb.borderColor).color,
      property: 'border-color',
      group: Parts$2.Thumb
    }
  };
};

var Parts$1;
/**
 * Transfor selects into scss variants
 * @param selects
 * @returns
 */
(function (Parts) {
  Parts["Select"] = "select";
  Parts["Label"] = "label";
  Parts["Option"] = "option";
  Parts["Icon"] = "icon";
  Parts["AdditionalInfo"] = "additional-info";
})(Parts$1 || (Parts$1 = {}));
const transformSelectComponentsToScssTypes = selects => {
  const lines = [];
  lines.push(`$select-sizes: ( ${getSizesFromComponents(selects).map(type => `"${documentationObject.mapComponentSize(type, 'select')}"`).join(', ')} );`);
  lines.push(`$select-themes: ( ${getThemesFromComponents(selects).map(type => `"${type}"`).join(', ')} );`);
  lines.push(`$select-states: ( ${getStatesFromComponents(selects).map(type => `"${type == 'default' ? '' : type}"`).join(', ')} );`);
  return lines.join('\n\n') + '\n';
};

/**
 * Transform select comonent into scss variables
 * @param tokens
 * @returns
 */
const transformSelectComponentTokensToScssVariables = tokens => {
  const type = tokens.componentType === 'design' ? 'default' : documentationObject.mapComponentSize(tokens.size, 'select');
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;
  const state = tokens.componentType === 'design' ? tokens.state : undefined;
  return {
    /**
     * Main part
     */
    // Background
    [documentationObject.getScssVariableName({
      component: 'select',
      part: '',
      property: 'background',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background',
      group: Parts$1.Select
    },
    // Padding
    [documentationObject.getScssVariableName({
      component: 'select',
      part: '',
      property: 'padding-top',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top',
      group: Parts$1.Select
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: '',
      property: 'padding-right',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right',
      group: Parts$1.Select
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: '',
      property: 'padding-bottom',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom',
      group: Parts$1.Select
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: '',
      property: 'padding-left',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left',
      group: Parts$1.Select
    },
    // Border
    [documentationObject.getScssVariableName({
      component: 'select',
      part: '',
      property: 'border-width',
      theme,
      type,
      state
    })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width',
      group: Parts$1.Select
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: '',
      property: 'border-radius',
      theme,
      type,
      state
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius',
      group: Parts$1.Select
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: '',
      property: 'border-color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.borderColor).color,
      property: 'border-color',
      group: Parts$1.Select
    },
    // Box shadow
    [documentationObject.getScssVariableName({
      component: 'select',
      part: '',
      property: 'box-shadow',
      theme,
      type,
      state
    })]: {
      value: tokens.effects.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
      group: Parts$1.Select
    },
    /**
     * Label part
     */
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'label',
      property: 'spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.label.spacing}px`,
      property: 'margin-bottom',
      group: Parts$1.Label
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'label',
      property: 'font-family',
      theme,
      type,
      state
    })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font-family',
      group: Parts$1.Label
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'label',
      property: 'font-size',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font-size',
      group: Parts$1.Label
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'label',
      property: 'font-weight',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font-weight',
      group: Parts$1.Label
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'label',
      property: 'line-height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line-height',
      group: Parts$1.Label
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'label',
      property: 'letter-spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter-spacing',
      group: Parts$1.Label
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'label',
      property: 'text-align',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text-align',
      group: Parts$1.Label
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'label',
      property: 'text-transform',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.label.textCase),
      property: 'text-transform',
      group: Parts$1.Label
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'label',
      property: 'text-decoration',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text-decoration',
      group: Parts$1.Label
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'label',
      property: 'color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.label.color).color,
      property: 'color',
      group: Parts$1.Label
    },
    /**
     * Option part
     */
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'option',
      property: 'font-family',
      theme,
      type,
      state
    })]: {
      value: `'${tokens.parts.option.fontFamily}'`,
      property: 'font-family',
      group: Parts$1.Option
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'option',
      property: 'font-size',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.option.fontSize}px`,
      property: 'font-size',
      group: Parts$1.Option
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'option',
      property: 'font-weight',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.option.fontWeight}`,
      property: 'font-weight',
      group: Parts$1.Option
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'option',
      property: 'line-height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.option.lineHeight}`,
      property: 'line-height',
      group: Parts$1.Option
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'option',
      property: 'letter-spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.option.letterSpacing}px`,
      property: 'letter-spacing',
      group: Parts$1.Option
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'option',
      property: 'text-align',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.option.textAlign),
      property: 'text-align',
      group: Parts$1.Option
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'option',
      property: 'text-transform',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.option.textCase),
      property: 'text-transform',
      group: Parts$1.Option
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'option',
      property: 'text-decoration',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.option.textDecoration),
      property: 'text-decoration',
      group: Parts$1.Option
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'option',
      property: 'color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.option.color).color,
      property: 'color',
      group: Parts$1.Option
    },
    /**
     * Icon part
     */
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'icon',
      property: 'width',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.icon.width ?? '0'}px`,
      property: 'width',
      group: Parts$1.Icon
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'icon',
      property: 'width-raw',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.icon.width ?? '0'}`,
      property: 'width-raw',
      group: Parts$1.Icon
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'icon',
      property: 'height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.icon.height ?? '0'}px`,
      property: 'height',
      group: Parts$1.Icon
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'icon',
      property: 'height-raw',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.icon.height ?? '0'}`,
      property: 'height-raw',
      group: Parts$1.Icon
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'icon',
      property: 'color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.icon.color).color,
      property: 'color',
      group: Parts$1.Icon
    },
    /**
     * Additional info part
     */
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'additional-info',
      property: 'spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.additionalInfo.spacing}px`,
      property: 'spacing',
      group: Parts$1.AdditionalInfo
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'additional-info',
      property: 'font-family',
      theme,
      type,
      state
    })]: {
      value: `'${tokens.parts.additionalInfo.fontFamily}'`,
      property: 'font-family',
      group: Parts$1.AdditionalInfo
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'additional-info',
      property: 'font-size',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.additionalInfo.fontSize}px`,
      property: 'font-size',
      group: Parts$1.AdditionalInfo
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'additional-info',
      property: 'font-weight',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.additionalInfo.fontWeight}`,
      property: 'font-weight',
      group: Parts$1.AdditionalInfo
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'additional-info',
      property: 'line-height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.additionalInfo.lineHeight}`,
      property: 'line-height',
      group: Parts$1.AdditionalInfo
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'additional-info',
      property: 'letter-spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.additionalInfo.letterSpacing}px`,
      property: 'letter-spacing',
      group: Parts$1.AdditionalInfo
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'additional-info',
      property: 'text-align',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.additionalInfo.textAlign),
      property: 'text-align',
      group: Parts$1.AdditionalInfo
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'additional-info',
      property: 'text-transform',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.additionalInfo.textCase),
      property: 'text-transform',
      group: Parts$1.AdditionalInfo
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'additional-info',
      property: 'text-decoration',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.additionalInfo.textDecoration),
      property: 'text-decoration',
      group: Parts$1.AdditionalInfo
    },
    [documentationObject.getScssVariableName({
      component: 'select',
      part: 'additional-info',
      property: 'color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.additionalInfo.color).color,
      property: 'color',
      group: Parts$1.AdditionalInfo
    }
  };
};

var Part$1;
/**
 * Transform switches into scss variants
 * @param switches
 * @returns
 */
(function (Part) {
  Part["Switch"] = "switch";
  Part["Label"] = "label";
  Part["Thumb"] = "thumb";
})(Part$1 || (Part$1 = {}));
const transformSwitchesComponentsToScssTypes = switches => {
  const lines = [];
  lines.push(`$switch-sizes: ( ${getSizesFromComponents(switches).map(type => `"${documentationObject.mapComponentSize(type, 'switch')}"`).join(', ')} );`);
  lines.push(`$switch-themes: ( ${getThemesFromComponents(switches).map(type => `"${type}"`).join(', ')} );`);
  lines.push(`$switch-states: ( ${getStatesFromComponents(switches).map(type => `"${type == 'default' ? '' : type}"`).join(', ')} );`);
  return lines.join('\n\n') + '\n';
};
const transformSwitchComponentTokensToScssVariables = tokens => {
  const type = tokens.componentType === 'design' ? tokens.state : documentationObject.mapComponentSize(tokens.size, 'switch');
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;
  const state = tokens.componentType === 'design' ? tokens.activity : 'off';
  return {
    /**
     * Main part
     */
    // Spacing
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: '',
      property: 'padding-start',
      theme,
      type,
      state
    })]: {
      value: `${tokens.spacing ?? '0'}px`,
      property: 'padding-start',
      group: Part$1.Switch
    },
    // Size
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: '',
      property: 'width',
      theme,
      type,
      state
    })]: {
      value: `${tokens.width ?? '0'}px`,
      property: 'width',
      group: Part$1.Switch
    },
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: '',
      property: 'width-raw',
      theme,
      type,
      state
    })]: {
      value: `${tokens.width ?? '0'}`,
      property: 'width-raw',
      group: Part$1.Switch
    },
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: '',
      property: 'height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.height ?? '0'}px`,
      property: 'height',
      group: Part$1.Switch
    },
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: '',
      property: 'height-raw',
      theme,
      type,
      state
    })]: {
      value: `${tokens.height ?? '0'}`,
      property: 'height-raw',
      group: Part$1.Switch
    },
    // Background
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: '',
      property: 'background',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background',
      group: Part$1.Switch
    },
    // Border
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: '',
      property: 'border-width',
      theme,
      type,
      state
    })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width',
      group: Part$1.Switch
    },
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: '',
      property: 'border-radius',
      theme,
      type,
      state
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius',
      group: Part$1.Switch
    },
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: '',
      property: 'border-color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.borderColor).color,
      property: 'border-color',
      group: Part$1.Switch
    },
    // Opacity
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: '',
      property: 'opacity',
      theme,
      type,
      state
    })]: {
      value: `${tokens.opacity}`,
      property: 'opacity',
      group: Part$1.Switch
    },
    // Box shadow
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: '',
      property: 'box-shadow',
      theme,
      type,
      state
    })]: {
      value: tokens.effects.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
      group: Part$1.Switch
    },
    /**
     * Label part
     */
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: 'label',
      property: 'font-family',
      theme,
      type,
      state
    })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font-family',
      group: Part$1.Label
    },
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: 'label',
      property: 'font-size',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font-size',
      group: Part$1.Label
    },
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: 'label',
      property: 'font-weight',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font-weight',
      group: Part$1.Label
    },
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: 'label',
      property: 'line-height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line-height',
      group: Part$1.Label
    },
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: 'label',
      property: 'letter-spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter-spacing',
      group: Part$1.Label
    },
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: 'label',
      property: 'text-align',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text-align',
      group: Part$1.Label
    },
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: 'label',
      property: 'text-transform',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.label.textCase),
      property: 'text-transform',
      group: Part$1.Label
    },
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: 'label',
      property: 'text-decoration',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text-decoration',
      group: Part$1.Label
    },
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: 'label',
      property: 'color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.label.color).color,
      property: 'color',
      group: Part$1.Label
    },
    // Opacity
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: 'label',
      property: 'opacity',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.label.opacity}`,
      property: 'opacity',
      group: Part$1.Label
    },
    /**
     * THUMB PART
     */
    // Size
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: 'thumb',
      property: 'width',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.thumb.width ?? '0'}px`,
      property: 'width',
      group: Part$1.Thumb
    },
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: 'thumb',
      property: 'width-raw',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.thumb.width ?? '0'}`,
      property: 'width-raw',
      group: Part$1.Thumb
    },
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: 'thumb',
      property: 'height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.thumb.height ?? '0'}px`,
      property: 'height',
      group: Part$1.Thumb
    },
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: 'thumb',
      property: 'height-raw',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.thumb.height ?? '0'}`,
      property: 'height-raw',
      group: Part$1.Thumb
    },
    // Background
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: 'thumb',
      property: 'background',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.thumb.background).color,
      property: 'background',
      group: Part$1.Thumb
    },
    // Border
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: 'thumb',
      property: 'border-width',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.thumb.borderWeight}px`,
      property: 'border-width',
      group: Part$1.Thumb
    },
    [documentationObject.getScssVariableName({
      component: 'switch',
      part: 'thumb',
      property: 'border-color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.thumb.borderColor).color,
      property: 'border-color',
      group: Part$1.Thumb
    }
  };
};

var Part;
/**
 * Transform tooltips into scss variants
 * @param tooltips
 * @returns
 */
(function (Part) {
  Part["Tooltip"] = "tooltip";
})(Part || (Part = {}));
const transformTooltipComponentsToScssTypes = tooltips => {
  const lines = [];
  lines.push(`/* At present there are no tooltip types*/`);
  return lines.join('\n\n') + '\n';
};
const transformTooltipComponentTokensToScssVariables = ({
  ...tokens
}) => {
  return {
    /**
     * Main part
     */
    // Background
    [documentationObject.getScssVariableName({
      component: 'tooltip',
      part: '',
      property: 'background'
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background',
      group: Part.Tooltip
    },
    [documentationObject.getScssVariableName({
      component: 'tooltip',
      part: '',
      property: 'bg'
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.background).color,
      property: 'bg',
      group: Part.Tooltip
    },
    // Padding
    [documentationObject.getScssVariableName({
      component: 'tooltip',
      part: '',
      property: 'padding-y'
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-y',
      group: Part.Tooltip
    },
    [documentationObject.getScssVariableName({
      component: 'tooltip',
      part: '',
      property: 'padding-x'
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-x',
      group: Part.Tooltip
    },
    [documentationObject.getScssVariableName({
      component: 'tooltip',
      part: '',
      property: 'padding-top'
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top',
      group: Part.Tooltip
    },
    [documentationObject.getScssVariableName({
      component: 'tooltip',
      part: '',
      property: 'padding-right'
    })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right',
      group: Part.Tooltip
    },
    [documentationObject.getScssVariableName({
      component: 'tooltip',
      part: '',
      property: 'padding-bottom'
    })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom',
      group: Part.Tooltip
    },
    [documentationObject.getScssVariableName({
      component: 'tooltip',
      part: '',
      property: 'padding-left'
    })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left',
      group: Part.Tooltip
    },
    // Border
    [documentationObject.getScssVariableName({
      component: 'tooltip',
      part: '',
      property: 'border-width'
    })]: {
      value: `${tokens.borderWeight}`,
      property: 'border-width',
      group: Part.Tooltip
    },
    [documentationObject.getScssVariableName({
      component: 'tooltip',
      part: '',
      property: 'border-radius'
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius',
      group: Part.Tooltip
    },
    [documentationObject.getScssVariableName({
      component: 'tooltip',
      part: '',
      property: 'border-radius-sm'
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius-sm',
      group: Part.Tooltip
    },
    [documentationObject.getScssVariableName({
      component: 'tooltip',
      part: '',
      property: 'border-radius-lg'
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius-lg',
      group: Part.Tooltip
    },
    [documentationObject.getScssVariableName({
      component: 'tooltip',
      part: '',
      property: 'border-color'
    })]: {
      value: documentationObject.transformFigmaColorToCssColor(tokens.borderColor),
      property: 'border-color',
      group: Part.Tooltip
    },
    // Font
    [documentationObject.getScssVariableName({
      component: 'tooltip',
      part: '',
      property: 'font-family'
    })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font-family',
      group: Part.Tooltip
    },
    [documentationObject.getScssVariableName({
      component: 'tooltip',
      part: '',
      property: 'font-size'
    })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font-size',
      group: Part.Tooltip
    },
    [documentationObject.getScssVariableName({
      component: 'tooltip',
      part: '',
      property: 'font-weight'
    })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font-weight',
      group: Part.Tooltip
    },
    [documentationObject.getScssVariableName({
      component: 'tooltip',
      part: '',
      property: 'line-height'
    })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line-height',
      group: Part.Tooltip
    },
    [documentationObject.getScssVariableName({
      component: 'tooltip',
      part: '',
      property: 'letter-spacing'
    })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter-spacing',
      group: Part.Tooltip
    },
    [documentationObject.getScssVariableName({
      component: 'tooltip',
      part: '',
      property: 'text-align'
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text-align',
      group: Part.Tooltip
    },
    [documentationObject.getScssVariableName({
      component: 'tooltip',
      part: '',
      property: 'text-decoration'
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text-decoration',
      group: Part.Tooltip
    }
  };
};

function transformColorTypes(colors) {
  const stringBuilder = [];
  stringBuilder.push(`$color-groups: ( ${Array.from(new Set(colors.map(color => `"${color.group}"`))).join(', ')} );`);
  stringBuilder.push(`$color-names: ( ${colors.map(color => `"${color.group}-${color.machineName}"`).join(', ')} );`);
  stringBuilder.push(``);
  return stringBuilder.join('\n');
}
function transformColors$1(colors) {
  const stringBuilder = [];
  colors.forEach(color => {
    stringBuilder.push(`$color-${color.group}-${color.machineName}: ${color.value};`);
  });
  return stringBuilder.join('\n');
}

function transformEffectTypes(effects) {
  const stringBuilder = [];
  const validEffects = effects?.filter(effect => effect.effects && effect.effects.length > 0);
  if (validEffects) {
    stringBuilder.push(`$effects: ( ${validEffects.map(effect => `"${effect.group}-${effect.machineName}"`).join(', ')} );`);
    stringBuilder.push(``);
  }
  return stringBuilder.join('\n');
}
function transformEffects$1(effects) {
  const stringBuilder = [];
  const validEffects = effects?.filter(effect => effect.effects && effect.effects.length > 0);
  if (validEffects) {
    validEffects.forEach(effect => {
      stringBuilder.push(`$effect-${effect.group}-${effect.machineName}: ${effect.effects.map(effect => effect.value).join(', ') || 'none'};`);
    });
  }
  return stringBuilder.join('\n');
}

function transformTypographyTypes(typography) {
  const stringBuilder = [];
  stringBuilder.push(`$type-sizes: ( ${typography.map(type => `"${getTypeName$1(type)}"`).join(', ')} );`);
  return stringBuilder.join('\n');
}
function transformTypography$1(typography) {
  const stringBuilder = [];
  typography.forEach(type => {
    stringBuilder.push([`$typography-${getTypeName$1(type)}-font-family: '${type.values.fontFamily}';`, `$typography-${getTypeName$1(type)}-font-size: ${type.values.fontSize}px;`, `$typography-${getTypeName$1(type)}-font-weight: ${type.values.fontWeight};`, `$typography-${getTypeName$1(type)}-line-height: ${(type.values.lineHeightPx / type.values.fontSize).toFixed(1)};`, `$typography-${getTypeName$1(type)}-letter-spacing: ${type.values.letterSpacing}px;`, `$typography-${getTypeName$1(type)}-paragraph-spacing: ${type.values.paragraphSpacing | 20}px;`].join('\n'));
  });
  return stringBuilder.join('\n');
}
function getTypeName$1(type) {
  return type.group ? `${type.group}-${type.machine_name}` : `${type.machine_name}`;
}

/**
 * Build a set of Component types to use as a set of SCSS vars
 * @param documentationObject
 * @returns
 */
function scssTypesTransformer(documentationObject) {
  const components = {
    // Buttons
    buttons: transformButtonComponentsToScssTypes(documentationObject.components.buttons),
    checkboxes: transformCheckboxComponentsToScssTypes(documentationObject.components.checkboxes),
    switches: transformSwitchesComponentsToScssTypes(documentationObject.components.switches),
    selects: transformSelectComponentsToScssTypes(documentationObject.components.selects),
    inputs: transformInputComponentsToScssTypes(documentationObject.components.inputs),
    modal: transformModalComponentsToScssTypes(documentationObject.components.modal),
    pagination: transformPaginationComponentsToScssTypes(documentationObject.components.pagination),
    alerts: transformAlertComponentsToScssTypes(documentationObject.components.alerts),
    tooltips: transformTooltipComponentsToScssTypes(documentationObject.components.tooltips),
    radios: transformRadioComponentsToScssTypes(documentationObject.components.radios)
  };
  const design = {
    // Buttons
    colors: transformColorTypes(documentationObject.design.color),
    effects: transformEffectTypes(documentationObject.design.effect),
    typography: transformTypographyTypes(documentationObject.design.typography)
  };
  return {
    components,
    design
  };
}

/**
 * Transform all the components to scss
 * @param documentationObject
 * @returns
 */
function scssTransformer(documentationObject) {
  const components = {
    // Buttons
    buttons: documentationObject.components.buttons.map(button => `// ${capitalize__default["default"](button.componentType === 'design' ? button.type : button.size)} button${button.componentType === 'design' ? `, theme: ${capitalize__default["default"](button.theme)}, state: ${capitalize__default["default"](button.state)}` : ''}
${Object.entries(transformButtonComponentTokensToScssVariables(button)).map(([variable, value]) => `${variable}: ${value.value};`).join('\n')}`).join('\n\n'),
    // Selects
    selects: documentationObject.components.selects.map(select => `// ${capitalize__default["default"](select.componentType === 'design' ? '' : `${select.size} `)}select${select.componentType === 'design' ? `, theme: ${capitalize__default["default"](select.theme)}, state: ${capitalize__default["default"](select.state)}` : ''}
${Object.entries(transformSelectComponentTokensToScssVariables(select)).map(([variable, value]) => `${variable}: ${value.value};`).join('\n')}`).join('\n\n'),
    checkboxes: documentationObject.components.checkboxes.map(checkbox => `// ${capitalize__default["default"](checkbox.componentType === 'design' ? '' : `${checkbox.size} `)}input${checkbox.componentType === 'design' ? `, theme: ${capitalize__default["default"](checkbox.theme)}, state: ${capitalize__default["default"](checkbox.state)}` : ''}
${Object.entries(transformCheckboxComponentTokensToScssVariables(checkbox)).map(([variable, value]) => `${variable}: ${value.value};`).join('\n')}`).join('\n\n'),
    // Inputs
    inputs: documentationObject.components.inputs.map(input => `// ${capitalize__default["default"](input.componentType === 'design' ? '' : `${input.size} `)}input${input.componentType === 'design' ? `, theme: ${capitalize__default["default"](input.theme)}, state: ${capitalize__default["default"](input.state)}` : ''}
${Object.entries(transformInputComponentTokensToScssVariables(input)).map(([variable, value]) => `${variable}: ${value.value};`).join('\n')}`).join('\n\n'),
    // Tooltips
    tooltips: documentationObject.components.tooltips.map(tooltip => `// tooltips
${Object.entries(transformTooltipComponentTokensToScssVariables(tooltip)).map(([variable, value]) => `${variable}: ${value.value};`).join('\n')}`).join('\n\n'),
    // Alerts
    alerts: documentationObject.components.alerts.map(alert => `// ${capitalize__default["default"](alert.componentType === 'design' ? alert.type : alert.layout)} alert
${Object.entries(transformAlertComponentTokensToScssVariables(alert)).map(([variable, value]) => `${variable}: ${value.value};`).join('\n')}`).join('\n\n'),
    // Modal
    modal: documentationObject.components.modal.map(modal => `// Modal
${Object.entries(transformModalComponentTokensToScssVariables(modal)).map(([variable, value]) => `${variable}: ${value.value};`).join('\n')}`).join('\n\n'),
    // Switches
    switches: documentationObject.components.switches.map(switchComponent => `// ${capitalize__default["default"](switchComponent.componentType === 'design' ? '' : switchComponent.size)} switch${switchComponent.componentType === 'design' ? `, theme: ${capitalize__default["default"](switchComponent.theme)}, state: ${capitalize__default["default"](switchComponent.state)}` : ''}
${Object.entries(transformSwitchComponentTokensToScssVariables(switchComponent)).map(([variable, value]) => `${variable}: ${value.value};`).join('\n')}`).join('\n\n'),
    // Pagination
    pagination: documentationObject.components.pagination.map(pagination => `// ${capitalize__default["default"](pagination.componentType === 'design' ? '' : pagination.size)} pagination${pagination.componentType === 'design' ? `, theme: ${capitalize__default["default"](pagination.theme)}, state: ${capitalize__default["default"](pagination.state)}` : ''}
${Object.entries(transformPaginationComponentTokensToScssVariables(pagination)).map(([variable, value]) => `${variable}: ${value.value};`).join('\n')}`).join('\n\n'),
    radios: documentationObject.components.radios.map(radio => `// ${capitalize__default["default"](radio.componentType === 'design' ? '' : radio.size)} pagination${radio.componentType === 'design' ? `, theme: ${capitalize__default["default"](radio.theme)}, state: ${capitalize__default["default"](radio.state)}` : ''}
${Object.entries(transformRadioComponentTokensToScssVariables(radio)).map(([variable, value]) => `${variable}: ${value.value};`).join('\n')}`).join('\n\n')
  };
  const design = {
    colors: transformColors$1(documentationObject.design.color),
    typography: transformTypography$1(documentationObject.design.typography),
    effects: transformEffects$1(documentationObject.design.effect)
  };
  return {
    components,
    design
  };
}

/**
 * Get the component template
 * @param component
 * @param parts
 * @returns
 */
const getComponentTemplate = async (component, ...parts) => {
  const componentFallbackPath = path__default["default"].resolve(__dirname, `../../templates/${component}/default.html`);
  if (!parts.length) {
    if (await fs__namespace["default"].pathExists(componentFallbackPath)) {
      return await fs__namespace["default"].readFile(componentFallbackPath, 'utf8');
    }
    return null;
  }
  const partsTemplatePath = path__default["default"].resolve(__dirname, `../../templates/${component}/${parts.join('/')}.html`);
  if (await fs__namespace["default"].pathExists(partsTemplatePath)) {
    return await fs__namespace["default"].readFile(partsTemplatePath, 'utf8');
  }
  return await getComponentTemplate(component, ...parts.slice(0, -1));
};

const getComponentTemplateByKey = async (componentKey, componentTokens) => {
  if (componentKey === 'buttons') {
    const tokens = componentTokens;
    if (tokens.componentType === 'design') {
      return await getComponentTemplate('button', tokens.type, tokens.state);
    }
    return await getComponentTemplate('button', tokens.size);
  }
  if (componentKey === 'selects') {
    const tokens = componentTokens;
    if (tokens.componentType === 'design') {
      return await getComponentTemplate('select', tokens.state);
    }
    return await getComponentTemplate('select', tokens.size);
  }
  if (componentKey === 'inputs') {
    const tokens = componentTokens;
    if (tokens.componentType === 'design') {
      return await getComponentTemplate('input', tokens.state);
    }
    return await getComponentTemplate('input', tokens.size);
  }
  if (componentKey === 'checkboxes') {
    const tokens = componentTokens;
    if (tokens.componentType === 'design') {
      return await getComponentTemplate('checkbox', tokens.state, tokens.activity);
    }
    return await getComponentTemplate('checkbox', tokens.size);
  }
  if (componentKey === 'tooltips') {
    const tokens = componentTokens;
    return await getComponentTemplate('tooltip', tokens.vertical, tokens.horizontal);
  }
  if (componentKey === 'modal') {
    return await getComponentTemplate('modal');
  }
  if (componentKey === 'alerts') {
    const tokens = componentTokens;
    if (tokens.componentType === 'design') {
      return await getComponentTemplate('alert', tokens.type);
    }
    return await getComponentTemplate('alert', tokens.layout);
  }
  if (componentKey === 'switches') {
    const tokens = componentTokens;
    if (tokens.componentType === 'design') {
      return await getComponentTemplate('switch', tokens.state, tokens.activity);
    }
    return await getComponentTemplate('switch', tokens.size);
  }
  if (componentKey === 'pagination') {
    const tokens = componentTokens;
    if (tokens.componentType === 'design') {
      return await getComponentTemplate('pagination', tokens.state);
    }
    return await getComponentTemplate('pagination', tokens.size);
  }
  if (componentKey === 'radios') {
    const tokens = componentTokens;
    if (tokens.componentType === 'design') {
      return await getComponentTemplate('radio', tokens.state, tokens.activity);
    }
    return await getComponentTemplate('radio', tokens.size);
  }
  return null;
};

/**
 * Transforms the component tokens into a preview and code
 */
const transformComponentTokens = async (componentKey, componentTokens) => {
  const template = await getComponentTemplateByKey(componentKey, componentTokens);
  if (!template) {
    return null;
  }
  const preview = Mustache__default["default"].render(template, componentTokens);
  const bodyEl = nodeHtmlParser.parse(preview).querySelector('body');
  return {
    id: componentTokens.id,
    preview,
    code: bodyEl ? bodyEl.innerHTML.trim() : preview
  };
};

/**
 * Transforms the documentation object components into a preview and code
 */
async function previewTransformer(documentationObject$1) {
  const {
    components
  } = documentationObject$1;
  const [buttons, selects, checkboxes, inputs, tooltips, modal, alerts, switches, pagination, radios] = await Promise.all([Promise.all(components.buttons.map(button => transformComponentTokens('buttons', button))).then(buttons => buttons.filter(documentationObject.filterOutNull)), Promise.all(components.selects.map(select => transformComponentTokens('selects', select))).then(selects => selects.filter(documentationObject.filterOutNull)), Promise.all(components.checkboxes.map(checkbox => transformComponentTokens('checkboxes', checkbox))).then(selects => selects.filter(documentationObject.filterOutNull)), Promise.all(components.inputs.map(input => transformComponentTokens('inputs', input))).then(inputs => inputs.filter(documentationObject.filterOutNull)), Promise.all(components.tooltips.map(tooltip => transformComponentTokens('tooltips', tooltip))).then(tooltips => tooltips.filter(documentationObject.filterOutNull)), Promise.all(components.modal.map(modal => transformComponentTokens('modal', modal))).then(modal => modal.filter(documentationObject.filterOutNull)), Promise.all(components.alerts.map(alert => transformComponentTokens('alerts', alert))).then(alerts => alerts.filter(documentationObject.filterOutNull)), Promise.all(components.switches.map(switchComponent => transformComponentTokens('switches', switchComponent))).then(switches => switches.filter(documentationObject.filterOutNull)), Promise.all(components.pagination.map(pagination => transformComponentTokens('pagination', pagination))).then(pagination => pagination.filter(documentationObject.filterOutNull)), Promise.all(components.radios.map(radio => transformComponentTokens('radios', radio))).then(radios => radios.filter(documentationObject.filterOutNull))]);
  return {
    components: {
      buttons,
      selects,
      checkboxes,
      inputs,
      tooltips,
      modal,
      alerts,
      switches,
      pagination,
      radios
    }
  };
}

const buildClientFiles = () => {
  webpack__default["default"]({
    mode: 'production',
    entry: path__default["default"].resolve(__dirname, '../../templates/main.js'),
    resolve: {
      modules: [path__default["default"].resolve(__dirname, '../..'), path__default["default"].resolve(__dirname, '../../node_modules'), path__default["default"].resolve(__dirname, '../../../../node_modules')]
    },
    output: {
      path: path__default["default"].resolve(__dirname, '../../public/components'),
      filename: 'bundle.js'
    },
    module: {
      rules: [{
        test: /\.s[ac]ss$/i,
        use: [
        // Creates `style` nodes from JS strings
        'style-loader',
        // Translates CSS into CommonJS
        'css-loader',
        // Compiles Sass to CSS
        'sass-loader']
      }]
    }
  }, (err, stats) => {
    if (err || stats?.hasErrors()) {
      // ...
      console.log(chalk__default["default"].red('Client styles failed'));
      throw err;
    }
    console.log(chalk__default["default"].green('Client Styles Built'));
    // Done processing
  });
};

/**
 * Map down to a variable object
 * @param alerts
 * @returns
 */
const transformAlertComponentsToCssVariables = alerts => {
  const lines = [];
  lines.push('.alert {');
  const cssVars = alerts.map(alert => `\t${cssCodeBlockComment('alert', alert)}\n${Object.entries(transformAlertComponentTokensToCssVariables(alert)).map(([variable, value]) => `\t${variable}: ${value.value};`).join('\n')}`);
  return lines.concat(cssVars).join('\n\n') + '\n}\n';
};

/**
 * Generate a list of css variables
 * @param tokens
 * @returns
 */
const transformAlertComponentTokensToCssVariables = tokens => {
  const type = tokens.componentType === 'design' ? tokens.type : tokens.layout;
  const theme = 'light';
  const state = 'default';
  return {
    // Background
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'background',
      part: '',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background'
    },
    // Padding
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'padding-top',
      part: '',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'padding-right',
      part: '',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'padding-bottom',
      part: '',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'padding-left',
      part: '',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left'
    },
    // Border
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'border-width',
      part: '',
      theme,
      type,
      state
    })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'border-radius',
      part: '',
      theme,
      type,
      state
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'border-color',
      part: '',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.borderColor).color,
      property: 'border-color'
    },
    // Box shadow
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'box-shadow',
      part: '',
      theme,
      type,
      state
    })]: {
      value: tokens.effects.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow'
    },
    // Spacing
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'spacing',
      part: '',
      theme,
      type,
      state
    })]: {
      value: `${tokens.spacing}px`,
      property: 'spacing'
    },
    // Close part
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'color',
      part: 'close',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.close.color).color,
      property: 'color'
    },
    // Icon part
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'color',
      part: 'icon',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.icon.color).color,
      property: 'color'
    },
    // Body part
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'spacing',
      part: 'body',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.body.spacing}px`,
      property: 'spacing'
    },
    // Content part
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'spacing',
      part: 'content',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.content.spacing}px`,
      property: 'spacing'
    },
    // Title part
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'font-family',
      part: 'title',
      theme,
      type,
      state
    })]: {
      value: `'${tokens.parts.title.fontFamily}'`,
      property: 'font-family'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'font-size',
      part: 'title',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.title.fontSize}px`,
      property: 'font-size'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'font-weight',
      part: 'title',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.title.fontWeight}`,
      property: 'font-weight'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'line-height',
      part: 'title',
      theme,
      type,
      state
    })]: {
      value: `${documentationObject.transformFigmaNumberToCss(tokens.parts.title.lineHeight)}`,
      property: 'line-height'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'letter-spacing',
      part: 'title',
      theme,
      type,
      state
    })]: {
      value: `${documentationObject.transformFigmaNumberToCss(tokens.parts.title.letterSpacing)}px`,
      property: 'letter-spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'text-align',
      part: 'title',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.title.textAlign),
      property: 'text-align'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'text-decoration',
      part: 'title',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.title.textDecoration),
      property: 'text-decoration'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'text-transform',
      part: 'title',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.title.textCase),
      property: 'text-transform'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'color',
      part: 'title',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.title.color).color,
      property: 'color'
    },
    // Text part
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'font-family',
      part: 'text',
      theme,
      type,
      state
    })]: {
      value: `'${tokens.parts.text.fontFamily}'`,
      property: 'font-family'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'font-size',
      part: 'text',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.text.fontSize}px`,
      property: 'font-size'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'font-weight',
      part: 'text',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.text.fontWeight}`,
      property: 'font-weight'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'line-height',
      part: 'text',
      theme,
      type,
      state
    })]: {
      value: `${documentationObject.transformFigmaNumberToCss(tokens.parts.text.lineHeight)}`,
      property: 'line-height'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'letter-spacing',
      part: 'text',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.text.letterSpacing}px`,
      property: 'letter-spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'text-align',
      part: 'text',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.text.textAlign),
      property: 'text-align'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'text-decoration',
      part: 'text',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.text.textDecoration),
      property: 'text-decoration'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'text-transform',
      part: 'text',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.text.textCase),
      property: 'text-transform'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'color',
      part: 'text',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.text.color).color,
      property: 'color'
    },
    // Actions part
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'spacing',
      part: 'actions',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.actions.spacing}px`,
      property: 'margin-left'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'font-family',
      part: 'actions',
      theme,
      type,
      state
    })]: {
      value: `'${tokens.parts.actions.fontFamily}'`,
      property: 'font-family'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'font-size',
      part: 'actions',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.actions.fontSize}px`,
      property: 'font-size'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'font-weight',
      part: 'actions',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.actions.fontWeight}`,
      property: 'font-weight'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'line-height',
      part: 'actions',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.actions.lineHeight}`,
      property: 'line-height'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'letter-spacing',
      part: 'actions',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.actions.letterSpacing}px`,
      property: 'letter-spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'text-align',
      part: 'actions',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.actions.textAlign),
      property: 'text-align'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'text-decoration',
      part: 'actions',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.actions.textDecoration),
      property: 'text-decoration'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'text-transform',
      part: 'actions',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.actions.textCase),
      property: 'text-transform'
    },
    [documentationObject.getCssVariableName({
      component: 'alert',
      property: 'color',
      part: 'actions',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.actions.color).color,
      property: 'color'
    }
  };
};

/**
 * Render css variables from button code
 * @param buttons
 * @returns
 */
const transformButtonComponentsToCssVariables = buttons => {
  const lines = [];
  lines.push('.btn {');
  const cssVars = buttons.map(button => ` ${cssCodeBlockComment('button', button)}\n ${Object.entries(transformButtonComponentTokensToCssVariables(button, config)).map(([variable, value]) => `  ${variable}: ${value.value};`).join('\n')}`);
  return lines.concat(cssVars).join('\n\n') + '\n}\n';
};

/**
 * Transform Buton components into Css vars
 * @param tokens
 * @returns
 */
const transformButtonComponentTokensToCssVariables = tokens => {
  const type = tokens.componentType === 'design' ? tokens.type : documentationObject.mapComponentSize(tokens.size, 'button');
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;
  const state = tokens.componentType === 'design' ? tokens.state : undefined;
  return {
    // Background
    [documentationObject.getCssVariableName({
      component: 'button',
      property: 'background',
      part: '',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background'
    },
    // Padding
    [documentationObject.getCssVariableName({
      component: 'button',
      property: 'padding-top',
      part: '',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top'
    },
    [documentationObject.getCssVariableName({
      component: 'button',
      property: 'padding-right',
      part: '',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right'
    },
    [documentationObject.getCssVariableName({
      component: 'button',
      property: 'padding-bottom',
      part: '',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom'
    },
    [documentationObject.getCssVariableName({
      component: 'button',
      property: 'padding-left',
      part: '',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left'
    },
    // Border
    [documentationObject.getCssVariableName({
      component: 'button',
      property: 'border-width',
      part: '',
      theme,
      type,
      state
    })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width'
    },
    [documentationObject.getCssVariableName({
      component: 'button',
      property: 'border-radius',
      part: '',
      theme,
      type,
      state
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius'
    },
    [documentationObject.getCssVariableName({
      component: 'button',
      property: 'border-color',
      part: '',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.borderColor).color,
      property: 'border-color'
    },
    // Font
    [documentationObject.getCssVariableName({
      component: 'button',
      property: 'font-family',
      part: '',
      theme,
      type,
      state
    })]: {
      value: `'${tokens.fontFamily}'`,
      property: 'font-family'
    },
    [documentationObject.getCssVariableName({
      component: 'button',
      property: 'font-size',
      part: '',
      theme,
      type,
      state
    })]: {
      value: `${tokens.fontSize}px`,
      property: 'font-size'
    },
    [documentationObject.getCssVariableName({
      component: 'button',
      property: 'font-weight',
      part: '',
      theme,
      type,
      state
    })]: {
      value: `${tokens.fontWeight}`,
      property: 'font-weight'
    },
    [documentationObject.getCssVariableName({
      component: 'button',
      property: 'line-height',
      part: '',
      theme,
      type,
      state
    })]: {
      value: `${tokens.lineHeight}`,
      property: 'line-height'
    },
    [documentationObject.getCssVariableName({
      component: 'button',
      property: 'letter-spacing',
      part: '',
      theme,
      type,
      state
    })]: {
      value: `${tokens.letterSpacing}px`,
      property: 'letter-spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'button',
      property: 'text-align',
      part: '',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.textAlign),
      property: 'text-align'
    },
    [documentationObject.getCssVariableName({
      component: 'button',
      property: 'text-decoration',
      part: '',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.textDecoration),
      property: 'text-decoration'
    },
    [documentationObject.getCssVariableName({
      component: 'button',
      property: 'text-transform',
      part: '',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.textCase),
      property: 'text-transform'
    },
    [documentationObject.getCssVariableName({
      component: 'button',
      property: 'color',
      part: '',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.color).color,
      property: 'color'
    },
    // Box shadow
    [documentationObject.getCssVariableName({
      component: 'button',
      property: 'box-shadow',
      part: '',
      theme,
      type,
      state
    })]: {
      value: tokens.effects.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow'
    },
    // Opacity
    [documentationObject.getCssVariableName({
      component: 'button',
      property: 'opacity',
      part: '',
      theme,
      type,
      state
    })]: {
      value: `${tokens.opacity}`,
      property: 'opacity'
    }
  };
};

/**
 * Transform checkbox tokens into CSS variables
 * @param checkboxes
 * @returns
 */
const transformCheckboxComponentsToCssVariables = checkboxes => {
  const lines = [];
  lines.push('.checkbox {');
  const cssVars = checkboxes.map(checkbox => `  ${cssCodeBlockComment('checkbox', checkbox)}\n ${Object.entries(transformCheckboxComponentTokensToCssVariables(checkbox)).map(([variable, value]) => `  ${variable}: ${value.value};`).join('\n')}`);
  return lines.concat(cssVars).join('\n\n') + '\n}\n';
};
const transformCheckboxComponentTokensToCssVariables = tokens => {
  const type = tokens.componentType === 'design' ? tokens.state : documentationObject.mapComponentSize(tokens.size, 'checkbox');
  const theme = 'light';
  const state = tokens.componentType === 'design' ? tokens.activity : 'off';
  return {
    /**
     * Checkbox part
     */
    // Button background
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      property: 'background',
      part: '',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.check.background).color,
      property: 'background'
    },
    // Size
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      property: 'width',
      part: '',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.width ?? '0'}px`,
      property: 'width'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      property: 'width-raw',
      part: '',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.width ?? '0'}`,
      property: 'width-raw'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      property: 'height',
      part: '',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.height ?? '0'}px`,
      property: 'height'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      property: 'height-raw',
      part: '',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.height ?? '0'}`,
      property: 'height-raw'
    },
    // Icon color
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      property: 'icon-color',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.check.color).color,
      property: 'icon-color'
    },
    // Opacity
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      property: 'opacity',
      type,
      theme,
      state
    })]: {
      value: `${tokens.opacity}`,
      property: 'opacity'
    },
    // Padding
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      property: 'padding-y',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'vertical padding'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      property: 'padding-x',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'horizontal padding'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      property: 'padding-top',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'top padding'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      property: 'padding-right',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingRight}px`,
      property: 'right padding'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      property: 'padding-bottom',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'bottom padding'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      property: 'padding-left',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'left padding'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      property: 'padding-start',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.paddingLeft}px`,
      property: 'checkbox left padding'
    },
    // Border
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      property: 'border-width',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.borderWeight}px`,
      property: 'border width'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      property: 'border-radius',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.borderRadius}px`,
      property: 'border radius'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      property: 'border-color',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.check.borderColor).color,
      property: 'border color'
    },
    // Box shadow
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      property: 'box-shadow',
      type,
      theme,
      state
    })]: {
      value: tokens.parts.check.effects.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box shadow'
    },
    /**
     * Icon part
     */
    // Size
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      part: 'icon',
      property: 'width',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.icon.width ?? '0'}px`,
      property: 'width'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      part: 'icon',
      property: 'width-raw',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.icon.width ?? '0'}`,
      property: 'width-raw'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      part: 'icon',
      property: 'height',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.icon.height ?? '0'}px`,
      property: 'height'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      part: 'icon',
      property: 'height-raw',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.icon.height ?? '0'}`,
      property: 'height-raw'
    },
    /**
     * Label part
     */
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      part: 'label',
      property: 'spacing',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      part: 'label',
      property: 'font-family',
      type,
      theme,
      state
    })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font family'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      part: 'label',
      property: 'font-size',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font size'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      part: 'label',
      property: 'font-weight',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font weight'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      part: 'label',
      property: 'line-height',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line height'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      part: 'label',
      property: 'letter-spacing',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      part: 'label',
      property: 'text-align',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text alignment'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      part: 'label',
      property: 'text-decoration',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text decoration'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      part: 'label',
      property: 'text-transform',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.label.textCase),
      property: 'text transformation'
    },
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      part: 'label',
      property: 'color',
      type,
      theme,
      state
    })]: {
      value: transformFigmaColorToCssColor(tokens.parts.label.color),
      property: 'text color'
    },
    // Opacity
    [documentationObject.getCssVariableName({
      component: 'checkbox',
      part: 'label',
      property: 'opacity',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.opacity}`,
      property: 'opacity'
    }
  };
};

/**
 * Generate css variable list from input components
 * @param inputs
 * @returns
 */
const transformInputComponentsToCssVariables = inputs => {
  const lines = [];
  lines.push('.input {');
  const cssVars = inputs.map(input => `${cssCodeBlockComment('input', input)}\n ${Object.entries(transformInputComponentTokensToCssVariables(input)).map(([variable, value]) => `  ${variable}: ${value.value};`).join('\n')}`);
  return lines.concat(cssVars).join('\n\n') + '\n}\n';
};
const transformInputComponentTokensToCssVariables = tokens => {
  const type = tokens.componentType === 'design' ? undefined : documentationObject.mapComponentSize(tokens.size, 'input');
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;
  const state = tokens.componentType === 'design' ? tokens.state : undefined;
  return {
    // Background
    [documentationObject.getCssVariableName({
      component: 'input',
      property: 'background',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background color'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      property: 'bg',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background color'
    },
    // Padding
    [documentationObject.getCssVariableName({
      component: 'input',
      property: 'padding-y',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'vertical padding'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      property: 'padding-x',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'horizontal padding'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      property: 'padding-top',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'top padding'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      property: 'padding-right',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingRight}px`,
      property: 'right padding'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      property: 'padding-bottom',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'bottom padding'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      property: 'padding-left',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'left padding'
    },
    // Border
    [documentationObject.getCssVariableName({
      component: 'input',
      property: 'border-width',
      type,
      theme,
      state
    })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border width'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      property: 'border-radius',
      type,
      theme,
      state
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border radius'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      property: 'border-color',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.borderColor).color,
      property: 'border color'
    },
    // Font
    [documentationObject.getCssVariableName({
      component: 'input',
      property: 'font-family',
      type,
      theme,
      state
    })]: {
      value: `'${tokens.parts.text.fontFamily}'`,
      property: 'font family'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      property: 'font-size',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.text.fontSize}px`,
      property: 'font size'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      property: 'font-weight',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.text.fontWeight}`,
      property: 'font weight'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      property: 'line-height',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.text.lineHeight}`,
      property: 'line height'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      property: 'letter-spacing',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.text.letterSpacing}px`,
      property: 'letter spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      property: 'text-align',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.text.textAlign),
      property: 'text alignment'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      property: 'text-decoration',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.text.textDecoration),
      property: 'text decoration'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      property: 'text-transform',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.text.textCase),
      property: 'text transformation'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      property: 'color',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaColorToCssColor(tokens.parts.text.color),
      property: 'text color'
    },
    // Box shadow
    [documentationObject.getCssVariableName({
      component: 'input',
      property: 'box-shadow',
      type,
      theme,
      state
    })]: {
      value: tokens.effects.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box shadow'
    },
    /**
     * Label part
     */
    [documentationObject.getCssVariableName({
      component: 'input',
      part: 'label',
      property: 'spacing',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.spacing}px`,
      property: 'spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      part: 'label',
      property: 'font-family',
      type,
      theme,
      state
    })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font family'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      part: 'label',
      property: 'font-size',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font size'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      part: 'label',
      property: 'font-weight',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font weight'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      part: 'label',
      property: 'line-height',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line height'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      part: 'label',
      property: 'letter-spacing',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      part: 'label',
      property: 'text-align',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text alignment'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      part: 'label',
      property: 'text-decoration',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text decoration'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      part: 'label',
      property: 'text-transform',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.label.textCase),
      property: 'text transformation'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      part: 'label',
      property: 'color',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaColorToCssColor(tokens.parts.label.color),
      property: 'text color'
    },
    /**
     * Icon part
     */
    [documentationObject.getCssVariableName({
      component: 'input',
      part: 'icon',
      property: 'border-width',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.icon.borderWeight}px`,
      property: 'border width'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      part: 'icon',
      property: 'border-color',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaColorToCssColor(tokens.parts.icon.borderColor),
      property: 'border color'
    },
    /**
     * Additional info part
     */
    [documentationObject.getCssVariableName({
      component: 'input',
      part: 'additional-info',
      property: 'spacing',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.additionalInfo.spacing}px`,
      property: 'spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      part: 'additional-info',
      property: 'font-family',
      type,
      theme,
      state
    })]: {
      value: `'${tokens.parts.additionalInfo.fontFamily}'`,
      property: 'font family'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      part: 'additional-info',
      property: 'font-size',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.additionalInfo.fontSize}px`,
      property: 'font size'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      part: 'additional-info',
      property: 'font-weight',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.additionalInfo.fontWeight}`,
      property: 'font weight'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      part: 'additional-info',
      property: 'line-height',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.additionalInfo.lineHeight}`,
      property: 'line height'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      part: 'additional-info',
      property: 'letter-spacing',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.additionalInfo.letterSpacing}px`,
      property: 'letter spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      part: 'additional-info',
      property: 'text-align',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.additionalInfo.textAlign),
      property: 'text alignment'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      part: 'additional-info',
      property: 'text-decoration',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.additionalInfo.textDecoration),
      property: 'text decoration'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      part: 'additional-info',
      property: 'text-transform',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.additionalInfo.textCase),
      property: 'text transformation'
    },
    [documentationObject.getCssVariableName({
      component: 'input',
      part: 'additional-info',
      property: 'color',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaColorToCssColor(tokens.parts.additionalInfo.color),
      property: 'text color'
    }
  };
};

var Parts;
/**
 * Transform Modal components into CSS Variables
 * @param modals
 * @returns
 */
(function (Parts) {
  Parts["Modal"] = "modal";
  Parts["Header"] = "header";
  Parts["Title"] = "title";
  Parts["Body"] = "body";
  Parts["Footer"] = "footer";
})(Parts || (Parts = {}));
const transformModalComponentsToCssVariables = modals => {
  const lines = [];
  lines.push('.modal {');
  const cssVars = modals.map(modal => `  ${cssCodeBlockComment('modal', modal)}\n ${Object.entries(transformModalComponentTokensToCssVariables(modal)).map(([variable, value]) => `  ${variable}: ${value.value};`).join('\n')}`);
  return lines.concat(cssVars).join('\n\n') + '\n}\n';
};
const transformModalComponentTokensToCssVariables = ({
  ...tokens
}) => {
  const type = tokens.componentType === 'design' ? tokens.type : documentationObject.mapComponentSize(tokens.size, 'modal');
  return {
    /**
     * MODAL PART
     */
    // Background
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: '',
      property: 'background',
      type
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background'
    },
    // Padding
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: '',
      property: 'padding-y',
      type
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-y'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: '',
      property: 'padding-x',
      type
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-x'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: '',
      property: 'padding-top',
      type
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: '',
      property: 'padding-right',
      type
    })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: '',
      property: 'padding-bottom',
      type
    })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: '',
      property: 'padding-left',
      type
    })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left'
    },
    // Border
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: '',
      property: 'border-width',
      type
    })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: '',
      property: 'border-radius',
      type
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: '',
      property: 'border-radius-sm',
      type
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius-sm'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: '',
      property: 'border-radius-lg',
      type
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius-lg'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: '',
      property: 'border-color',
      type
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.borderColor).color,
      property: 'border-color'
    },
    // Box shadow
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: '',
      property: 'box-shadow',
      type
    })]: {
      value: tokens.effects.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow'
    },
    /**
     * HEADER PART
     */
    // Background
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'header',
      property: 'background',
      type
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.header.background).color,
      property: 'background'
    },
    // Padding
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'header',
      property: 'padding-y',
      type
    })]: {
      value: `${tokens.parts.header.paddingTop}px`,
      property: 'padding-y'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'header',
      property: 'padding-x',
      type
    })]: {
      value: `${tokens.parts.header.paddingTop}px`,
      property: 'padding-x'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'header',
      property: 'padding-top',
      type
    })]: {
      value: `${tokens.parts.header.paddingTop}px`,
      property: 'padding-top'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'header',
      property: 'padding-right',
      type
    })]: {
      value: `${tokens.parts.header.paddingRight}px`,
      property: 'padding-right'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'header',
      property: 'padding-bottom',
      type
    })]: {
      value: `${tokens.parts.header.paddingBottom}px`,
      property: 'padding-bottom'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'header',
      property: 'padding-left',
      type
    })]: {
      value: `${tokens.parts.header.paddingLeft}px`,
      property: 'padding-left'
    },
    // Border
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'header',
      property: 'border-width',
      type
    })]: {
      value: `${tokens.parts.header.borderWeight}px`,
      property: 'border-width'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'header',
      property: 'border-radius',
      type
    })]: {
      value: `${tokens.parts.header.borderRadius}px`,
      property: 'border-radius'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'header',
      property: 'border-radius-sm',
      type
    })]: {
      value: `${tokens.parts.header.borderRadius}px`,
      property: 'border-radius-sm'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'header',
      property: 'border-radius-lg',
      type
    })]: {
      value: `${tokens.parts.header.borderRadius}px`,
      property: 'border-radius-lg'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'header',
      property: 'border-color',
      type
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.header.borderColor).color,
      property: 'border-color'
    },
    // Box shadow
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'header',
      property: 'box-shadow',
      type
    })]: {
      value: tokens.parts.header.effects.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow'
    },
    /**
     * TITLE PART
     */
    // Font
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'title',
      property: 'font-family',
      type
    })]: {
      value: `'${tokens.parts.header.title.fontFamily}'`,
      property: 'font-family'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'title',
      property: 'font-size',
      type
    })]: {
      value: `${tokens.parts.header.title.fontSize}px`,
      property: 'font-size'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'title',
      property: 'font-weight',
      type
    })]: {
      value: `${tokens.parts.header.title.fontWeight}`,
      property: 'font-weight'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'title',
      property: 'line-height',
      type
    })]: {
      value: `${tokens.parts.header.title.lineHeight}`,
      property: 'line-height'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'title',
      property: 'letter-spacing',
      type
    })]: {
      value: `${tokens.parts.header.title.letterSpacing}px`,
      property: 'letter-spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'title',
      property: 'text-align',
      type
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.header.title.textAlign),
      property: 'text-align'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'title',
      property: 'text-decoration',
      type
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.header.title.textDecoration),
      property: 'text-decoration'
    },
    /**
     * BODY PART
     */
    // Background
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'body',
      property: 'background',
      type
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.body.background).color,
      property: 'background'
    },
    // Padding
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'body',
      property: 'padding-y',
      type
    })]: {
      value: `${tokens.parts.body.paddingTop}px`,
      property: 'padding-y'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'body',
      property: 'padding-x',
      type
    })]: {
      value: `${tokens.parts.body.paddingTop}px`,
      property: 'padding-x'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'body',
      property: 'padding-top',
      type
    })]: {
      value: `${tokens.parts.body.paddingTop}px`,
      property: 'padding-top'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'body',
      property: 'padding-right',
      type
    })]: {
      value: `${tokens.parts.body.paddingRight}px`,
      property: 'padding-right'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'body',
      property: 'padding-bottom',
      type
    })]: {
      value: `${tokens.parts.body.paddingBottom}px`,
      property: 'padding-bottom'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'body',
      property: 'padding-left',
      type
    })]: {
      value: `${tokens.parts.body.paddingLeft}px`,
      property: 'padding-left'
    },
    // Border
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'body',
      property: 'border-width',
      type
    })]: {
      value: `${tokens.parts.body.borderWeight}px`,
      property: 'border-width'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'body',
      property: 'border-radius',
      type
    })]: {
      value: `${tokens.parts.body.borderRadius}px`,
      property: 'border-radius'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'body',
      property: 'border-radius-sm',
      type
    })]: {
      value: `${tokens.parts.body.borderRadius}px`,
      property: 'border-radius-sm'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'body',
      property: 'border-radius-lg',
      type
    })]: {
      value: `${tokens.parts.body.borderRadius}px`,
      property: 'border-radius-lg'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'body',
      property: 'border-color',
      type
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.body.borderColor).color,
      property: 'border-color'
    },
    // Box shadow
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'body',
      property: 'box-shadow',
      type
    })]: {
      value: tokens.parts.body.effects.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow'
    },
    // Font
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'body',
      property: 'font-family',
      type
    })]: {
      value: `'${tokens.parts.body.content.fontFamily}'`,
      property: 'font-family'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'body',
      property: 'font-size',
      type
    })]: {
      value: `${tokens.parts.body.content.fontSize}px`,
      property: 'font-size'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'body',
      property: 'font-weight',
      type
    })]: {
      value: `${tokens.parts.body.content.fontWeight}`,
      property: 'font-weight'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'body',
      property: 'line-height',
      type
    })]: {
      value: `${tokens.parts.body.content.lineHeight}`,
      property: 'line-height'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'body',
      property: 'letter-spacing',
      type
    })]: {
      value: `${tokens.parts.body.content.letterSpacing}px`,
      property: 'letter-spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'body',
      property: 'text-align',
      type
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.body.content.textAlign),
      property: 'text-align'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'body',
      property: 'text-decoration',
      type
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.body.content.textDecoration),
      property: 'text-decoration'
    },
    /**
     * FOOTER PART
     */
    // Background
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'background',
      type
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.footer.background).color,
      property: 'background'
    },
    // Padding
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'padding-y',
      type
    })]: {
      value: `${tokens.parts.footer.paddingTop}px`,
      property: 'padding-y'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'padding-x',
      type
    })]: {
      value: `${tokens.parts.footer.paddingTop}px`,
      property: 'padding-x'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'padding-top',
      type
    })]: {
      value: `${tokens.parts.footer.paddingTop}px`,
      property: 'padding-top'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'padding-right',
      type
    })]: {
      value: `${tokens.parts.footer.paddingRight}px`,
      property: 'padding-right'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'padding-bottom',
      type
    })]: {
      value: `${tokens.parts.footer.paddingBottom}px`,
      property: 'padding-bottom'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'padding-left',
      type
    })]: {
      value: `${tokens.parts.footer.paddingLeft}px`,
      property: 'padding-left'
    },
    // Border
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'border-width',
      type
    })]: {
      value: `${tokens.parts.footer.borderWeight}px`,
      property: 'border-width'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'border-radius',
      type
    })]: {
      value: `${tokens.parts.footer.borderRadius}px`,
      property: 'border-radius'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'border-radius-sm',
      type
    })]: {
      value: `${tokens.parts.footer.borderRadius}px`,
      property: 'border-radius-sm'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'border-radius-lg',
      type
    })]: {
      value: `${tokens.parts.footer.borderRadius}px`,
      property: 'border-radius-lg'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'border-color',
      type
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.footer.borderColor).color,
      property: 'border-color'
    },
    // Box shadow
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'box-shadow',
      type
    })]: {
      value: tokens.parts.footer.effects.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow'
    },
    // Font
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'font-family',
      type
    })]: {
      value: `'${tokens.parts.footer.copy.fontFamily}'`,
      property: 'font-family'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'font-size',
      type
    })]: {
      value: `${tokens.parts.footer.copy.fontSize}px`,
      property: 'font-size'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'font-weight',
      type
    })]: {
      value: `${tokens.parts.footer.copy.fontWeight}`,
      property: 'font-weight'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'line-height',
      type
    })]: {
      value: `${tokens.parts.footer.copy.lineHeight}`,
      property: 'line-height'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'letter-spacing',
      type
    })]: {
      value: `${tokens.parts.footer.copy.letterSpacing}px`,
      property: 'letter-spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'text-align',
      type
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.footer.copy.textAlign),
      property: 'text-align'
    },
    [documentationObject.getCssVariableName({
      component: 'modal',
      part: 'footer',
      property: 'text-decoration',
      type
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.footer.copy.textDecoration),
      property: 'text-decoration'
    }
  };
};

/**
 * Transform Pagination components into CSS vars
 * @param pagination
 * @returns
 */
const transformPaginationComponentsToCssVariables = pagination => {
  const lines = [];
  lines.push('.pagination {');
  const cssVars = pagination.map(page => `${cssCodeBlockComment('pagination', page)}\n ${Object.entries(transformPaginationComponentTokensToCssVariables(page)).map(([variable, value]) => `  ${variable}: ${value.value};`).join('\n')}`);
  return lines.concat(cssVars).join('\n\n') + '\n}\n';
};
const transformPaginationComponentTokensToCssVariables = tokens => {
  const type = tokens.componentType === 'design' ? 'default' : documentationObject.mapComponentSize(tokens.size, 'pagination');
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;
  const state = tokens.componentType === 'design' ? tokens.state : undefined;
  return {
    // Background
    [documentationObject.getCssVariableName({
      component: 'pagination',
      property: 'background',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background'
    },
    // Border
    [documentationObject.getCssVariableName({
      component: 'pagination',
      property: 'border-width',
      theme,
      type,
      state
    })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      property: 'border-radius',
      theme,
      type,
      state
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      property: 'border-color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.borderColor).color,
      property: 'border-color'
    },
    // Spacing
    [documentationObject.getCssVariableName({
      component: 'pagination',
      property: 'spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.spacing}px`,
      property: 'spacing'
    },
    // Previous part
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'background',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.previous.background).color,
      property: 'background'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'border-width',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.previous.borderWeight}px`,
      property: 'border-width'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'border-radius',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.previous.borderRadius}px`,
      property: 'border-radius'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'border-color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.previous.borderColor).color,
      property: 'border-color'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'padding-top',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.previous.paddingTop}px`,
      property: 'padding-top'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'padding-right',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.previous.paddingRight}px`,
      property: 'padding-right'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'padding-bottom',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.previous.paddingBottom}px`,
      property: 'padding-bottom'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'padding-left',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.previous.paddingLeft}px`,
      property: 'padding-left'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'font-family',
      theme,
      type,
      state
    })]: {
      value: `'${tokens.parts.previous.fontFamily}'`,
      property: 'font-family'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'font-size',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.previous.fontSize}px`,
      property: 'font-size'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'font-weight',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.previous.fontWeight}`,
      property: 'font-weight'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'line-height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.previous.lineHeight}`,
      property: 'line-height'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'letter-spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.previous.letterSpacing}px`,
      property: 'letter-spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'text-align',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.previous.textAlign),
      property: 'text-align'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'text-transform',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.previous.textCase),
      property: 'text-transform'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'text-decoration',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.previous.textDecoration),
      property: 'text-decoration'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.previous.color).color,
      property: 'color'
    },
    // Next part
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'background',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.next.background).color,
      property: 'background'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'border-width',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.next.borderWeight}px`,
      property: 'border-width'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'border-radius',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.next.borderRadius}px`,
      property: 'border-radius'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'border-color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.next.borderColor).color,
      property: 'border-color'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'padding-top',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.next.paddingTop}px`,
      property: 'padding-top'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'padding-right',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.next.paddingRight}px`,
      property: 'padding-right'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'padding-bottom',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.next.paddingBottom}px`,
      property: 'padding-bottom'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'padding-left',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.next.paddingLeft}px`,
      property: 'padding-left'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'font-family',
      theme,
      type,
      state
    })]: {
      value: `'${tokens.parts.next.fontFamily}'`,
      property: 'font-family'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'font-size',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.next.fontSize}px`,
      property: 'font-size'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'font-weight',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.next.fontWeight}`,
      property: 'font-weight'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'line-height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.next.lineHeight}`,
      property: 'line-height'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'letter-spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.next.letterSpacing}px`,
      property: 'letter-spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'text-align',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.next.textAlign),
      property: 'text-align'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'text-transform',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.next.textCase),
      property: 'text-transform'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'text-decoration',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.next.textDecoration),
      property: 'text-decoration'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.next.color).color,
      property: 'color'
    },
    // Item part
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'background',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.item.background).color,
      property: 'background'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'border-width',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.item.borderWeight}px`,
      property: 'border-width'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'border-radius',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.item.borderRadius}px`,
      property: 'border-radius'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'border-color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.item.borderColor).color,
      property: 'border-color'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'padding-top',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.item.paddingTop}px`,
      property: 'padding-top'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'padding-right',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.item.paddingRight}px`,
      property: 'padding-right'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'padding-bottom',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.item.paddingBottom}px`,
      property: 'padding-bottom'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'padding-left',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.item.paddingLeft}px`,
      property: 'padding-left'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'font-family',
      theme,
      type,
      state
    })]: {
      value: `'${tokens.parts.item.fontFamily}'`,
      property: 'font-family'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'font-size',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.item.fontSize}px`,
      property: 'font-size'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'font-weight',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.item.fontWeight}`,
      property: 'font-weight'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'line-height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.item.lineHeight}`,
      property: 'line-height'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'letter-spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.item.letterSpacing}px`,
      property: 'letter-spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'text-align',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.item.textAlign),
      property: 'text-align'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'text-transform',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.item.textCase),
      property: 'text-transform'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'text-decoration',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.item.textDecoration),
      property: 'text-decoration'
    },
    [documentationObject.getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.item.color).color,
      property: 'color'
    }
  };
};

/**
 * Transform Radio Components into CSS Variables
 * @param radios
 * @returns
 */
const transformRadioComponentsToCssVariables = radios => {
  const lines = [];
  lines.push('.radio {');
  const cssVars = radios.map(radio => `  ${cssCodeBlockComment('radio', radio)}\n ${Object.entries(transformRadioComponentTokensToCssVariables(radio)).map(([variable, value]) => `  ${variable}: ${value.value};`).join('\n')}`);
  return lines.concat(cssVars).join('\n\n') + '\n}\n';
};
const transformRadioComponentTokensToCssVariables = tokens => {
  const type = tokens.componentType === 'design' ? tokens.state : documentationObject.mapComponentSize(tokens.size, 'radio');
  const theme = 'light';
  const state = tokens.componentType === 'design' ? tokens.activity : 'off';
  return {
    // Button background
    [documentationObject.getCssVariableName({
      component: 'radio',
      property: 'background',
      part: '',
      type,
      theme,
      state
    })]: {
      property: 'background',
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.check.background).color
    },
    // Size
    [documentationObject.getCssVariableName({
      component: 'radio',
      property: 'width',
      part: '',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.width ?? '0'}px`,
      property: 'width'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      property: 'width-raw',
      part: '',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.width ?? '0'}`,
      property: 'width-raw'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      property: 'height',
      part: '',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.height ?? '0'}px`,
      property: 'height'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      property: 'height-raw',
      part: '',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.height ?? '0'}`,
      property: 'height-raw'
    },
    // Padding
    [documentationObject.getCssVariableName({
      component: 'radio',
      property: 'padding-y',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'vertical padding'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      property: 'padding-x',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'horizontal padding'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      property: 'padding-top',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'top padding'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      property: 'padding-right',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingRight}px`,
      property: 'right padding'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      property: 'padding-bottom',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'bottom padding'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      property: 'padding-left',
      type,
      theme,
      state
    })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'left padding'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      property: 'padding-start',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.paddingLeft}px`,
      property: 'radio left padding'
    },
    // Border
    [documentationObject.getCssVariableName({
      component: 'radio',
      property: 'border-width',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.borderWeight}px`,
      property: 'border width'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      property: 'border-radius',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.check.borderRadius}px`,
      property: 'border radius'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      property: 'border-color',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.check.borderColor).color,
      property: 'border color'
    },
    // Opacity
    [documentationObject.getCssVariableName({
      component: 'radio',
      property: 'opacity',
      type,
      theme,
      state
    })]: {
      value: `${tokens.opacity}`,
      property: 'opacity'
    },
    // Box shadow
    [documentationObject.getCssVariableName({
      component: 'radio',
      property: 'box-shadow',
      type,
      theme,
      state
    })]: {
      value: tokens.parts.check.effects.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box shadow'
    },
    /**
     * Label part
     */
    [documentationObject.getCssVariableName({
      component: 'radio',
      part: 'label',
      property: 'spacing',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      part: 'label',
      property: 'font-family',
      type,
      theme,
      state
    })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font family'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      part: 'label',
      property: 'font-size',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font size'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      part: 'label',
      property: 'font-weight',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font weight'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      part: 'label',
      property: 'line-height',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line height'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      part: 'label',
      property: 'letter-spacing',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      part: 'label',
      property: 'text-align',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text alignment'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      part: 'label',
      property: 'text-decoration',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text decoration'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      part: 'label',
      property: 'text-transform',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.label.textCase),
      property: 'text transformation'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      part: 'label',
      property: 'color',
      type,
      theme,
      state
    })]: {
      value: transformFigmaColorToCssColor(tokens.parts.label.color),
      property: 'text color'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      part: 'label',
      property: 'opacity',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.label.opacity}`,
      property: 'opacity'
    },
    /**
     * Thumb part
     */
    // Size
    [documentationObject.getCssVariableName({
      component: 'radio',
      part: 'thumb',
      property: 'width',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.thumb.width ?? '0'}px`,
      property: 'width'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      part: 'thumb',
      property: 'width-raw',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.thumb.width ?? '0'}`,
      property: 'width-raw'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      part: 'thumb',
      property: 'height',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.thumb.height ?? '0'}px`,
      property: 'height'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      part: 'thumb',
      property: 'height-raw',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.thumb.height ?? '0'}`,
      property: 'height-raw'
    },
    // Background
    [documentationObject.getCssVariableName({
      component: 'radio',
      part: 'thumb',
      property: 'background',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.thumb.background).color,
      property: 'background'
    },
    // Border
    [documentationObject.getCssVariableName({
      component: 'radio',
      part: 'thumb',
      property: 'border-width',
      type,
      theme,
      state
    })]: {
      value: `${tokens.parts.thumb.borderWeight}px`,
      property: 'border-width'
    },
    [documentationObject.getCssVariableName({
      component: 'radio',
      part: 'thumb',
      property: 'border-color',
      type,
      theme,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.thumb.borderColor).color,
      property: 'border-color'
    }
  };
};

/**
 * Transform Select component to css vars
 * @param selects
 * @returns
 */
const transformSelectComponentsToCssVariables = selects => {
  const lines = [];
  lines.push('.select {');
  const cssVars = selects.map(select => `  ${cssCodeBlockComment('select', select)}\n ${Object.entries(transformSelectComponentTokensToCssVariables(select)).map(([variable, value]) => `  ${variable}: ${value.value};`).join('\n')}`);
  return lines.concat(cssVars).join('\n\n') + '\n}\n';
};

/**
 * Transform Select Components into CSS variables
 * @param tokens
 * @returns
 */
const transformSelectComponentTokensToCssVariables = tokens => {
  const type = tokens.componentType === 'design' ? 'default' : documentationObject.mapComponentSize(tokens.size, 'select');
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;
  const state = tokens.componentType === 'design' ? tokens.state : undefined;
  return {
    // Background
    [documentationObject.getCssVariableName({
      component: 'select',
      property: 'background',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background'
    },
    // Padding
    [documentationObject.getCssVariableName({
      component: 'select',
      property: 'padding-top',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      property: 'padding-right',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      property: 'padding-bottom',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      property: 'padding-left',
      theme,
      type,
      state
    })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left'
    },
    // Border
    [documentationObject.getCssVariableName({
      component: 'select',
      property: 'border-width',
      theme,
      type,
      state
    })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      property: 'border-radius',
      theme,
      type,
      state
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      property: 'border-color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.borderColor).color,
      property: 'border-color'
    },
    // Box shadow
    [documentationObject.getCssVariableName({
      component: 'select',
      property: 'box-shadow',
      theme,
      type,
      state
    })]: {
      value: tokens.effects.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow'
    },
    // Label part
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'label',
      property: 'spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.label.spacing}px`,
      property: 'margin-bottom'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'label',
      property: 'font-family',
      theme,
      type,
      state
    })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font-family'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'label',
      property: 'font-size',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font-size'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'label',
      property: 'font-weight',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font-weight'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'label',
      property: 'line-height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line-height'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'label',
      property: 'letter-spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter-spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'label',
      property: 'text-align',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text-align'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'label',
      property: 'text-transform',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.label.textCase),
      property: 'text-transform'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'label',
      property: 'text-decoration',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text-decoration'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'label',
      property: 'color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.label.color).color,
      property: 'color'
    },
    // Option part
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'option',
      property: 'font-family',
      theme,
      type,
      state
    })]: {
      value: `'${tokens.parts.option.fontFamily}'`,
      property: 'font-family'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'option',
      property: 'font-size',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.option.fontSize}px`,
      property: 'font-size'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'option',
      property: 'font-weight',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.option.fontWeight}`,
      property: 'font-weight'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'option',
      property: 'line-height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.option.lineHeight}`,
      property: 'line-height'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'option',
      property: 'letter-spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.option.letterSpacing}px`,
      property: 'letter-spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      property: 'text-align',
      part: 'option',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.option.textAlign),
      property: 'text-align'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      property: 'text-transform',
      part: 'option',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.option.textCase),
      property: 'text-transform'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      property: 'text-decoration',
      part: 'option',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.option.textDecoration),
      property: 'text-decoration'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      property: 'color',
      part: 'option',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.option.color).color,
      property: 'color'
    },
    // Icon part
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'icon',
      property: 'width',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.icon.width ?? '0'}px`,
      property: 'width'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'icon',
      property: 'width-raw',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.icon.width ?? '0'}`,
      property: 'width-raw'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'icon',
      property: 'height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.icon.height ?? '0'}px`,
      property: 'height'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'icon',
      property: 'height-raw',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.icon.height ?? '0'}`,
      property: 'height-raw'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'icon',
      property: 'color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.icon.color).color,
      property: 'color'
    },
    // Additional info part
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'additional-info',
      property: 'spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.additionalInfo.spacing}px`,
      property: 'spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'additional-info',
      property: 'font-family',
      theme,
      type,
      state
    })]: {
      value: `'${tokens.parts.additionalInfo.fontFamily}'`,
      property: 'font-family'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'additional-info',
      property: 'font-size',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.additionalInfo.fontSize}px`,
      property: 'font-size'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'additional-info',
      property: 'font-weight',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.additionalInfo.fontWeight}`,
      property: 'font-weight'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'additional-info',
      property: 'line-height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.additionalInfo.lineHeight}`,
      property: 'line-height'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      part: 'additional-info',
      property: 'letter-spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.additionalInfo.letterSpacing}px`,
      property: 'letter-spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      property: 'text-align',
      part: 'additional-info',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.additionalInfo.textAlign),
      property: 'text-align'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      property: 'text-transform',
      part: 'additional-info',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.additionalInfo.textCase),
      property: 'text-transform'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      property: 'text-decoration',
      part: 'additional-info',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.additionalInfo.textDecoration),
      property: 'text-decoration'
    },
    [documentationObject.getCssVariableName({
      component: 'select',
      property: 'color',
      part: 'additional-info',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.additionalInfo.color).color,
      property: 'color'
    }
  };
};

/**
 * Transform switches into css variables
 * @param switches
 * @returns
 */
const transformSwitchesComponentsToCssVariables = switches => {
  const lines = [];
  lines.push('.switch {');
  const cssVars = switches.map(component => `  ${cssCodeBlockComment('switch', component)}\n ${Object.entries(transformSwitchComponentTokensToCssVariables(component)).map(([variable, value]) => `  ${variable}: ${value.value};`).join('\n')}`);
  return lines.concat(cssVars).join('\n\n') + '\n}\n';
};
const transformSwitchComponentTokensToCssVariables = tokens => {
  const type = tokens.componentType === 'design' ? tokens.state : documentationObject.mapComponentSize(tokens.size, 'switch');
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;
  const state = tokens.componentType === 'design' ? tokens.activity : 'off';
  return {
    /**
     * SWITCH PART
     */
    // Spacing
    [documentationObject.getCssVariableName({
      component: 'switch',
      property: 'padding-start',
      theme,
      type,
      state
    })]: {
      value: `${tokens.spacing ?? '0'}px`,
      property: 'padding-start'
    },
    // Size
    [documentationObject.getCssVariableName({
      component: 'switch',
      property: 'width',
      theme,
      type,
      state
    })]: {
      value: `${tokens.width ?? '0'}px`,
      property: 'width'
    },
    [documentationObject.getCssVariableName({
      component: 'switch',
      property: 'width-raw',
      theme,
      type,
      state
    })]: {
      value: `${tokens.width ?? '0'}`,
      property: 'width-raw'
    },
    [documentationObject.getCssVariableName({
      component: 'switch',
      property: 'height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.height ?? '0'}px`,
      property: 'height'
    },
    [documentationObject.getCssVariableName({
      component: 'switch',
      property: 'height-raw',
      theme,
      type,
      state
    })]: {
      value: `${tokens.height ?? '0'}`,
      property: 'height-raw'
    },
    // Background
    [documentationObject.getCssVariableName({
      component: 'switch',
      property: 'background',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background'
    },
    // Border
    [documentationObject.getCssVariableName({
      component: 'switch',
      property: 'border-width',
      theme,
      type,
      state
    })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width'
    },
    [documentationObject.getCssVariableName({
      component: 'switch',
      property: 'border-radius',
      theme,
      type,
      state
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius'
    },
    [documentationObject.getCssVariableName({
      component: 'switch',
      property: 'border-color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.borderColor).color,
      property: 'border-color'
    },
    // Opacity
    [documentationObject.getCssVariableName({
      component: 'switch',
      property: 'opacity',
      theme,
      type,
      state
    })]: {
      value: `${tokens.opacity}`,
      property: 'opacity'
    },
    // Box shadow
    [documentationObject.getCssVariableName({
      component: 'switch',
      property: 'box-shadow',
      theme,
      type,
      state
    })]: {
      value: tokens.effects.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow'
    },
    /**
     * LABEL PART
     */
    [documentationObject.getCssVariableName({
      component: 'switch',
      part: 'label',
      property: 'font-family',
      theme,
      type,
      state
    })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font-family'
    },
    [documentationObject.getCssVariableName({
      component: 'switch',
      part: 'label',
      property: 'font-size',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font-size'
    },
    [documentationObject.getCssVariableName({
      component: 'switch',
      part: 'label',
      property: 'font-weight',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font-weight'
    },
    [documentationObject.getCssVariableName({
      component: 'switch',
      part: 'label',
      property: 'line-height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line-height'
    },
    [documentationObject.getCssVariableName({
      component: 'switch',
      part: 'label',
      property: 'letter-spacing',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter-spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'switch',
      part: 'label',
      property: 'text-align',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text-align'
    },
    [documentationObject.getCssVariableName({
      component: 'switch',
      part: 'label',
      property: 'text-transform',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokens.parts.label.textCase),
      property: 'text-transform'
    },
    [documentationObject.getCssVariableName({
      component: 'switch',
      part: 'label',
      property: 'text-decoration',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text-decoration'
    },
    [documentationObject.getCssVariableName({
      component: 'switch',
      part: 'label',
      property: 'color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.label.color).color,
      property: 'color'
    },
    // Opacity
    [documentationObject.getCssVariableName({
      component: 'switch',
      part: 'label',
      property: 'opacity',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.label.opacity}`,
      property: 'opacity'
    },
    /**
     * THUMB PART
     */
    // Size
    [documentationObject.getCssVariableName({
      component: 'switch',
      part: 'thumb',
      property: 'width',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.thumb.width ?? '0'}px`,
      property: 'width'
    },
    [documentationObject.getCssVariableName({
      component: 'switch',
      part: 'thumb',
      property: 'width-raw',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.thumb.width ?? '0'}`,
      property: 'width-raw'
    },
    [documentationObject.getCssVariableName({
      component: 'switch',
      part: 'thumb',
      property: 'height',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.thumb.height ?? '0'}px`,
      property: 'height'
    },
    [documentationObject.getCssVariableName({
      component: 'switch',
      part: 'thumb',
      property: 'height-raw',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.thumb.height ?? '0'}`,
      property: 'height-raw'
    },
    // Background
    [documentationObject.getCssVariableName({
      component: 'switch',
      part: 'thumb',
      property: 'background',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.thumb.background).color,
      property: 'background'
    },
    // Border
    [documentationObject.getCssVariableName({
      component: 'switch',
      part: 'thumb',
      property: 'border-width',
      theme,
      type,
      state
    })]: {
      value: `${tokens.parts.thumb.borderWeight}px`,
      property: 'border-width'
    },
    [documentationObject.getCssVariableName({
      component: 'switch',
      part: 'thumb',
      property: 'border-color',
      theme,
      type,
      state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.parts.thumb.borderColor).color,
      property: 'border-color'
    }
  };
};

/**
 * Build a css variable map for
 * @param tooltips
 * @returns
 */
const transformTooltipComponentsToCssVariables = tooltips => {
  const lines = [];
  lines.push('.tooltip {');
  const cssVars = tooltips.map(component => `/* Tooltips Horizontal: ${component.horizontal} Vertical: ${component.vertical}*/ \n ${Object.entries(transformTooltipComponentTokensToCssVariables(component)).map(([variable, value]) => `  ${variable}: ${value.value};`).join('\n')}`);
  return lines.concat(cssVars).join('\n\n') + '\n}\n';
};
const transformTooltipComponentTokensToCssVariables = ({
  ...tokens
}) => {
  return {
    // Background
    [documentationObject.getCssVariableName({
      component: 'tooltip',
      property: 'background',
      part: ''
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background'
    },
    [documentationObject.getCssVariableName({
      component: 'tooltip',
      property: 'bg',
      part: ''
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokens.background).color,
      property: 'bg'
    },
    // Padding
    [documentationObject.getCssVariableName({
      component: 'tooltip',
      property: 'padding-y',
      part: ''
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-y'
    },
    [documentationObject.getCssVariableName({
      component: 'tooltip',
      property: 'padding-x',
      part: ''
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-x'
    },
    [documentationObject.getCssVariableName({
      component: 'tooltip',
      property: 'padding-top',
      part: ''
    })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top'
    },
    [documentationObject.getCssVariableName({
      component: 'tooltip',
      property: 'padding-right',
      part: ''
    })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right'
    },
    [documentationObject.getCssVariableName({
      component: 'tooltip',
      property: 'padding-bottom',
      part: ''
    })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom'
    },
    [documentationObject.getCssVariableName({
      component: 'tooltip',
      property: 'padding-left',
      part: ''
    })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left'
    },
    // Border
    [documentationObject.getCssVariableName({
      component: 'tooltip',
      property: 'border-width',
      part: ''
    })]: {
      value: `${tokens.borderWeight}`,
      property: 'border-width'
    },
    [documentationObject.getCssVariableName({
      component: 'tooltip',
      property: 'border-radius',
      part: ''
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius'
    },
    [documentationObject.getCssVariableName({
      component: 'tooltip',
      property: 'border-radius-sm',
      part: ''
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius-sm'
    },
    [documentationObject.getCssVariableName({
      component: 'tooltip',
      property: 'border-radius-lg',
      part: ''
    })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius-lg'
    },
    [documentationObject.getCssVariableName({
      component: 'tooltip',
      property: 'border-color',
      part: ''
    })]: {
      value: documentationObject.transformFigmaColorToCssColor(tokens.borderColor),
      property: 'border-color'
    },
    // Font
    [documentationObject.getCssVariableName({
      component: 'tooltip',
      property: 'font-family',
      part: ''
    })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font-family'
    },
    [documentationObject.getCssVariableName({
      component: 'tooltip',
      property: 'font-size',
      part: ''
    })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font-size'
    },
    [documentationObject.getCssVariableName({
      component: 'tooltip',
      property: 'font-weight',
      part: ''
    })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font-weight'
    },
    [documentationObject.getCssVariableName({
      component: 'tooltip',
      property: 'line-height',
      part: ''
    })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line-height'
    },
    [documentationObject.getCssVariableName({
      component: 'tooltip',
      property: 'letter-spacing',
      part: ''
    })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter-spacing'
    },
    [documentationObject.getCssVariableName({
      component: 'tooltip',
      property: 'text-align',
      part: ''
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text-align'
    },
    [documentationObject.getCssVariableName({
      component: 'tooltip',
      property: 'text-decoration',
      part: ''
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text-decoration'
    }
  };
};

function transformColors(colors) {
  const stringBuilder = [];
  colors.forEach(color => {
    stringBuilder.push(`--color-${color.group}-${color.machineName}: ${color.value};`);
  });
  return stringBuilder.join('\n');
}

/**
 * Build effects CSS var list
 * @param effects 
 * @returns 
 */
function transformEffects(effects) {
  const stringBuilder = [];
  const validEffects = effects?.filter(effect => effect.effects && effect.effects.length > 0);
  if (validEffects) {
    validEffects.forEach(effect => {
      stringBuilder.push(`--effect-${effect.group}-${effect.machineName}: ${effect.effects.map(effect => effect.value).join(', ') || 'none'};`);
    });
  }
  return stringBuilder.join('\n');
}

function transformTypography(typography) {
  const stringBuilder = [];
  typography.forEach(type => {
    stringBuilder.push([`--typography-${getTypeName(type)}-font-family: '${type.values.fontFamily}';`, `--typography-${getTypeName(type)}-font-size: ${type.values.fontSize}px;`, `--typography-${getTypeName(type)}-font-weight: ${type.values.fontWeight};`, `--typography-${getTypeName(type)}-line-height: ${(type.values.lineHeightPx / type.values.fontSize).toFixed(1)};`, `--typography-${getTypeName(type)}-letter-spacing: ${type.values.letterSpacing}px;`, `--typography-${getTypeName(type)}-paragraph-spacing: ${type.values.paragraphSpacing | 20}px;`].join('\n'));
  });
  return stringBuilder.join('\n');
}
function getTypeName(type) {
  return type.group ? `${type.group}-${type.machine_name}` : `${type.machine_name}`;
}

function cssTransformer(documentationObject) {
  const components = {
    // Buttons
    buttons: transformButtonComponentsToCssVariables(documentationObject.components.buttons),
    checkboxes: transformCheckboxComponentsToCssVariables(documentationObject.components.checkboxes),
    switches: transformSwitchesComponentsToCssVariables(documentationObject.components.switches),
    selects: transformSelectComponentsToCssVariables(documentationObject.components.selects),
    inputs: transformInputComponentsToCssVariables(documentationObject.components.inputs),
    modal: transformModalComponentsToCssVariables(documentationObject.components.modal),
    pagination: transformPaginationComponentsToCssVariables(documentationObject.components.pagination),
    alerts: transformAlertComponentsToCssVariables(documentationObject.components.alerts),
    tooltips: transformTooltipComponentsToCssVariables(documentationObject.components.tooltips),
    radios: transformRadioComponentsToCssVariables(documentationObject.components.radios)
  };
  const design = {
    colors: transformColors(documentationObject.design.color),
    typography: transformTypography(documentationObject.design.typography),
    effects: transformEffects(documentationObject.design.effect)
  };
  return {
    components,
    design
  };
}

/**
 * Detect a font present in the public dir.  If it matches a font family from
 * figma, zip it up and make it avaliable in the config for use
 */
async function fontTransformer(documentationObject) {
  const {
    design
  } = documentationObject;
  const outputFolder = 'public';
  const fontLocation = path__default["default"].join(outputFolder, 'fonts');
  const families = design.typography.reduce((result, current) => {
    return {
      ...result,
      [current.values.fontFamily]: result[current.values.fontFamily] ?
      // sorts and returns unique font weights
      sortedUniq__default["default"]([...result[current.values.fontFamily], current.values.fontWeight].sort((a, b) => a - b)) : [current.values.fontWeight]
    };
  }, {});
  const customFonts = [];
  Object.keys(families).map(async key => {
    //
    const name = key.replace(/\s/g, '');
    const fontDirName = path__default["default"].join(fontLocation, name);
    if (fs__namespace["default"].existsSync(fontDirName)) {
      console.log(chalk__default["default"].green(`Found a custom font ${name}`));
      // Ok, we've found a custom font at this location
      // Zip the font up and put the zip in the font location
      const stream = fs__namespace["default"].createWriteStream(path__default["default"].join(fontLocation, `${name}.zip`));
      await zipFonts(fontDirName, stream);
      customFonts.push(`${name}.zip`);
    }
  });
  return customFonts;
}

/**
 * Zip the fonts for download
 * @param dirPath
 * @param destination
 * @returns
 */
const zipFonts = async (dirPath, destination) => {
  const archive = archiver__default["default"]('zip', {
    zlib: {
      level: 9
    } // Sets the compression level.
  });

  // good practice to catch this error explicitly
  archive.on('error', function (err) {
    throw err;
  });
  archive.pipe(destination);
  const fontDir = await fs__namespace["default"].readdir(dirPath);
  for (const file of fontDir) {
    const data = fs__namespace["default"].readFileSync(path__default["default"].join(dirPath, file), 'utf-8');
    archive.append(data, {
      name: path__default["default"].basename(file)
    });
  }
  await archive.finalize();
  return destination;
};

/**
 * Derive the path to the integration. Use the config to find the integration
 * and version.  Fall over to bootstrap 5.2.  Allow users to define custom
 * integration if desired
 */
const getPathToIntegration = () => {
  const integrationFolder = 'integrations';
  const defaultIntegration = 'bootstrap';
  const defaultVersion = '5.2';
  const defaultPath = path__default["default"].resolve(path__default["default"].join(integrationFolder, defaultIntegration, defaultVersion));
  const config = documentationObject.getFetchConfig();
  if (config.integration) {
    if (config.integration.name === 'custom') {
      // Look for a custom integration
      const customPath = path__default["default"].resolve(path__default["default"].join(integrationFolder, 'custom'));
      if (!fs__namespace["default"].existsSync(customPath)) {
        throw Error(`The config is set to use a custom integration but no custom integration found at integrations/custom`);
      }
      return customPath;
    }
    const searchPath = path__default["default"].resolve(path__default["default"].join(integrationFolder, config.integration.name, config.integration.version));
    if (!fs__namespace["default"].existsSync(searchPath)) {
      throw Error(`The requested integration was ${config.integration.name} version ${config.integration.version} but no integration plugin with that name was found`);
    }
    return searchPath;
  }
  return defaultPath;
};
const getIntegrationName = () => {
  const config = documentationObject.getFetchConfig();
  const defaultIntegration = 'bootstrap';
  if (config.integration) {
    if (config.integration.name) {
      return config.integration.name;
    }
  }
  return defaultIntegration;
};

/**
 * Find the integration to sync and sync the sass files and template files.
 */
async function integrationTransformer() {
  const outputFolder = path__default["default"].join('public');
  const integrationPath = getPathToIntegration();
  const integrationName = getIntegrationName();
  const sassFolder = `exported/${integrationName}-tokens`;
  const templatesFolder = process.env.OUTPUT_DIR || 'templates';
  const integrationsSass = path__default["default"].resolve(integrationPath, 'sass');
  const integrationTemplates = path__default["default"].resolve(integrationPath, 'templates');
  fs__namespace["default"].copySync(integrationsSass, sassFolder);
  fs__namespace["default"].copySync(integrationTemplates, templatesFolder);
  const stream = fs__namespace["default"].createWriteStream(path__default["default"].join(outputFolder, `tokens.zip`));
  await zipTokens('exported', stream);
}

/**
 * Zip the fonts for download
 * @param dirPath
 * @param destination
 * @returns
 */
const zipTokens = async (dirPath, destination) => {
  let archive = archiver__default["default"]('zip', {
    zlib: {
      level: 9
    } // Sets the compression level.
  });

  // good practice to catch this error explicitly
  archive.on('error', function (err) {
    throw err;
  });
  archive.pipe(destination);
  const directory = await fs__namespace["default"].readdir(dirPath);
  archive = await addFileToZip(directory, dirPath, archive);
  await archive.finalize();
  return destination;
};

/**
 * A recusrive function for building a zip of the tokens
 * @param directory
 * @param dirPath
 * @param archive
 * @returns
 */
const addFileToZip = async (directory, dirPath, archive) => {
  for (const file of directory) {
    const pathFile = path__default["default"].join(dirPath, file);
    if (fs__namespace["default"].lstatSync(pathFile).isDirectory()) {
      const recurse = await fs__namespace["default"].readdir(pathFile);
      archive = await addFileToZip(recurse, pathFile, archive);
    } else {
      const data = fs__namespace["default"].readFileSync(pathFile, 'utf-8');
      archive.append(data, {
        name: pathFile
      });
    }
  }
  return archive;
};

const outputFolder = process.env.OUTPUT_DIR || 'exported';
const tokensFilePath = path__default["default"].join(outputFolder, 'tokens.json');
const previewFilePath = path__default["default"].join(outputFolder, 'preview.json');
const changelogFilePath = path__default["default"].join(outputFolder, 'changelog.json');
const variablesFilePath = path__default["default"].join(outputFolder, 'tokens');
const iconsZipFilePath = path__default["default"].join(outputFolder, 'icons.zip');
const logosZipFilePath = path__default["default"].join(outputFolder, 'logos.zip');

/**
 * Read Previous Json File
 * @param path
 * @returns
 */
const readPrevJSONFile = async path => {
  try {
    return await fs__namespace.readJSON(path);
  } catch (e) {
    return undefined;
  }
};

/**
 * Build just the custom fonts
 * @param documentationObject
 * @returns
 */
const buildCustomFonts = async documentationObject => {
  return await fontTransformer(documentationObject);
};

/**
 * Build just the custom fonts
 * @param documentationObject
 * @returns
 */
const buildIntegration = async documentationObject => {
  return await integrationTransformer();
};

/**
 * Run just the preview
 * @param documentationObject
 */
const buildPreview = async documentationObject => {
  if (Object.keys(documentationObject.components).filter(name => documentationObject.components[name].length > 0).length > 0) {
    await Promise.all([previewTransformer(documentationObject).then(out => fs__namespace.writeJSON(previewFilePath, out, {
      spaces: 2
    })), buildClientFiles()]);
  } else {
    console.log(chalk__default["default"].red('Skipping preview generation'));
  }
};

/**
 * Build only the styles pipeline
 * @param documentationObject
 */
const buildStyles = async documentationObject => {
  const typeFiles = scssTypesTransformer(documentationObject);
  const cssFiles = cssTransformer(documentationObject);
  const scssFiles = scssTransformer(documentationObject);
  await Promise.all([fs__namespace.ensureDir(variablesFilePath).then(() => fs__namespace.ensureDir(`${variablesFilePath}/types`)).then(() => fs__namespace.ensureDir(`${variablesFilePath}/css`)).then(() => fs__namespace.ensureDir(`${variablesFilePath}/sass`)).then(() => Promise.all(Object.entries(typeFiles.components).map(([name, content]) => fs__namespace.writeFile(`${variablesFilePath}/types/${name}.scss`, content)))).then(() => Promise.all(Object.entries(typeFiles.design).map(([name, content]) => fs__namespace.writeFile(`${variablesFilePath}/types/${name}.scss`, content)))).then(() => Promise.all(Object.entries(cssFiles.components).map(([name, content]) => fs__namespace.writeFile(`${variablesFilePath}/css/${name}.css`, content)))).then(() => Promise.all(Object.entries(cssFiles.design).map(([name, content]) => fs__namespace.writeFile(`${variablesFilePath}/css/${name}.css`, content)))).then(() => Promise.all(Object.entries(scssFiles.components).map(([name, content]) => fs__namespace.writeFile(`${variablesFilePath}/sass/${name}.scss`, content)))).then(() => Promise.all(Object.entries(scssFiles.design).map(([name, content]) => fs__namespace.writeFile(`${variablesFilePath}/sass/${name}.scss`, content))))]);
};
/**
 * Run the entire pipeline
 */
const entirePipeline = async () => {
  const DEV_ACCESS_TOKEN = process.env.DEV_ACCESS_TOKEN;
  const FIGMA_PROJECT_ID = process.env.FIGMA_PROJECT_ID;

  // TODO: rename to something more meaningful
  if (!DEV_ACCESS_TOKEN) {
    throw new Error('Missing "DEV_ACCESS_TOKEN" env variable.');
  }

  // TODO: rename to something more meaningful
  if (!FIGMA_PROJECT_ID) {
    throw new Error('Missing "FIGMA_PROJECT_ID" env variable.');
  }
  let prevDocumentationObject = await readPrevJSONFile(tokensFilePath);
  let changelog = (await readPrevJSONFile(changelogFilePath)) || [];
  await fs__namespace.emptyDir(outputFolder);
  const documentationObject$1 = await documentationObject.createDocumentationObject(FIGMA_PROJECT_ID, DEV_ACCESS_TOKEN);
  const changelogRecord = documentationObject.generateChangelogRecord(prevDocumentationObject, documentationObject$1);
  if (changelogRecord) {
    changelog = [changelogRecord, ...changelog];
  }
  await Promise.all([fs__namespace.writeJSON(tokensFilePath, documentationObject$1, {
    spaces: 2
  }), fs__namespace.writeJSON(changelogFilePath, changelog, {
    spaces: 2
  }), ...(!process.env.CREATE_ASSETS_ZIP_FILES || process.env.CREATE_ASSETS_ZIP_FILES !== 'false' ? [documentationObject.zipAssets(documentationObject$1.assets.icons, fs__namespace.createWriteStream(iconsZipFilePath)).then(writeStream => stream__namespace.promises.finished(writeStream)), documentationObject.zipAssets(documentationObject$1.assets.logos, fs__namespace.createWriteStream(logosZipFilePath)).then(writeStream => stream__namespace.promises.finished(writeStream))] : [])]);
  await buildCustomFonts(documentationObject$1);
  await buildStyles(documentationObject$1);
  await buildIntegration();
  await buildPreview(documentationObject$1);
  console.log(chalk__default["default"].green(`Figma pipeline complete:`, `${documentationObject.getRequestCount()} requests`));
};

// Check to see what options have been passed and
(async function () {
  try {
    if (process.argv.length === 2 || process.argv.length === 3 && process.argv.indexOf('--debug') > 0) {
      await entirePipeline();
    }
    if (process.argv.length === 3) {
      if (process.argv.indexOf('preview') > 0) {
        let documentationObject = await readPrevJSONFile(tokensFilePath);
        if (documentationObject) {
          await buildPreview(documentationObject);
          await buildIntegration(documentationObject);
        } else {
          throw Error('Cannot run preview only because tokens do not exist. Run the fetch first.');
        }
      } else if (process.argv.indexOf('integration') > 0) {
        let documentationObject = await readPrevJSONFile(tokensFilePath);
        if (documentationObject) {
          await buildStyles(documentationObject);
          await buildPreview(documentationObject);
          await buildIntegration(documentationObject);
        } else {
          throw Error('Cannot run preview only because tokens do not exist. Run the fetch first.');
        }
      } else if (process.argv.indexOf('styles') > 0) {
        let documentationObject = await readPrevJSONFile(tokensFilePath);
        if (documentationObject) {
          await buildStyles(documentationObject);
        } else {
          throw Error('Cannot run styles only because tokens do not exist. Run the fetch first.');
        }
      } else if (process.argv.indexOf('fonts') > 0) {
        let documentationObject = await readPrevJSONFile(tokensFilePath);
        if (documentationObject) {
          await buildCustomFonts(documentationObject);
        } else {
          throw Error('Cannot run styles only because tokens do not exist. Run the fetch first.');
        }
      }
    }
  } catch (error) {
    let message = 'Unknown Error';
    if (error instanceof Error) message = error.message;
    console.error(chalk__default["default"].red(message));
    if (process.argv.indexOf('--debug') > 0) {
      throw error;
    } else {
      console.log(chalk__default["default"].red('The fetch pipeline was halted because of an error. \n - To debug this error, rerun it with `-- --debug`'));
    }
  }
})();
