module.exports = {
  customSyntax: require('postcss-scss'),
  plugins: ['stylelint-scss'],
  ignoreFiles: ['./docs/**/*.scss'],
  rules: {
    'color-no-invalid-hex': true,
    'font-family-no-duplicate-names': true,
    'function-calc-no-unspaced-operator': true,
    'function-linear-gradient-no-nonstandard-direction': true,
    'string-no-newline': true,
    'unit-no-unknown': true,
    'property-no-unknown': true,
    'keyframe-declaration-no-important': true,
    'declaration-block-no-duplicate-properties': [
      true,
      {
        ignore: ['consecutive-duplicates-with-different-values'],
      },
    ],
    'declaration-block-no-shorthand-property-overrides': true,
    'block-no-empty': true,
    'selector-pseudo-class-no-unknown': true,
    'selector-pseudo-element-no-unknown': true,
    'selector-type-no-unknown': true,
    'media-feature-name-no-unknown': true,
    'comment-no-empty': true,
    'no-empty-source': true,
    'no-extra-semicolons': true,
    'color-named': [
      'never',
      {
        ignore: ['inside-function'],
      },
    ],
    'number-max-precision': 5,
    'declaration-no-important': [
      null,
      {
        message:
          "It's not recommended to use !imporant, use it only for edge cases and utility classes (declaration-no-important)",
        severity: 'warning',
      },
    ],
    'declaration-block-single-line-max-declarations': 1,
    'selector-max-empty-lines': 0,
    'color-hex-case': 'lower',
    'color-hex-length': 'short',
    'font-family-name-quotes': 'always-unless-keyword',
    'font-weight-notation': 'named-where-possible',
    'function-comma-space-after': 'always',
    'function-comma-space-before': 'never',
    'function-name-case': 'lower',
    'function-parentheses-space-inside': 'always-single-line',
    'function-url-quotes': 'always',
    'function-whitespace-after': 'always',
    'number-leading-zero': 'never',
    'number-no-trailing-zeros': true,
    'string-quotes': 'single',
    'length-zero-no-unit': true,
    'unit-case': 'lower',
    'value-keyword-case': 'lower',
    'value-list-comma-space-after': 'always-single-line',
    'value-list-comma-space-before': 'never',
    'value-list-max-empty-lines': 0,
    'custom-property-empty-line-before': 'never',
    'property-case': 'lower',
    'declaration-bang-space-after': 'never',
    'declaration-bang-space-before': 'always',
    'declaration-colon-space-after': 'always',
    'declaration-colon-space-before': 'never',
    'declaration-empty-line-before': 'never',
    'declaration-block-semicolon-newline-after': 'always-multi-line',
    'declaration-block-semicolon-newline-before': 'never-multi-line',
    'declaration-block-semicolon-space-after': 'always-single-line',
    'declaration-block-semicolon-space-before': 'never',
    'declaration-block-trailing-semicolon': 'always',
    'block-closing-brace-empty-line-before': 'never',
    'block-closing-brace-newline-after': [
      'always',
      {
        ignoreAtRules: ['if', 'else'],
      },
    ],
    'block-closing-brace-newline-before': 'always-multi-line',
    'block-opening-brace-newline-after': 'always-multi-line',
    'block-opening-brace-space-before': 'always',
    'selector-attribute-brackets-space-inside': 'always',
    'selector-attribute-operator-space-after': 'never',
    'selector-attribute-operator-space-before': 'never',
    'selector-attribute-quotes': 'always',
    'selector-combinator-space-after': 'always',
    'selector-combinator-space-before': 'always',
    'selector-descendant-combinator-no-non-space': true,
    'selector-pseudo-class-case': 'lower',
    'selector-pseudo-class-parentheses-space-inside': 'always',
    'selector-pseudo-element-case': 'lower',
    'selector-pseudo-element-colon-notation': 'double',
    'selector-type-case': 'lower',
    'selector-list-comma-space-after': 'always-single-line',
    'selector-list-comma-space-before': 'never',
    'rule-empty-line-before': [
      'always',
      {
        except: ['first-nested'],
        ignore: ['after-comment'],
      },
    ],
    'media-feature-colon-space-after': 'always',
    'media-feature-colon-space-before': 'never',
    'media-feature-name-case': 'lower',
    'media-feature-parentheses-space-inside': 'always',
    'media-feature-range-operator-space-after': 'always',
    'media-feature-range-operator-space-before': 'always',
    'media-query-list-comma-space-after': 'always',
    'media-query-list-comma-space-before': 'never',
    'at-rule-empty-line-before': [
      'always',
      {
        except: ['first-nested', 'blockless-after-blockless'],
        ignoreAtRules: ['else', 'else if'],
        ignore: ['after-comment'],
      },
    ],
    'at-rule-name-case': 'lower',
    'at-rule-name-space-after': 'always',
    'at-rule-semicolon-newline-after': 'always',
    'at-rule-semicolon-space-before': 'never',
    'comment-whitespace-inside': 'always',
    indentation: [
      'tab',
      {
        ignore: ['value'],
      },
    ],
    'no-eol-whitespace': true,
    'no-missing-end-of-source-newline': true,
  },
};
