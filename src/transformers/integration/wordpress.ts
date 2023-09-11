import { BackgroundTokenSet, BorderTokenSet, FillTokenSet, SpacingTokenSet, TypographyTokenSet } from 'src/exporters/components/types';
import { DocumentationObject, HookReturn } from '../../types';
import * as Utils from '../../utils';
import { transformFigmaFillsToCssColor } from '../../utils/convertColor';
import { startCase } from 'lodash';

interface ColorGradient {
  name: string,
  slug: string,
  gradient: string,
}

interface ColorPallete {
  name: string,
  slug: string,
  color: string,
}

export const postWordPressIntegration = (documentationObject: DocumentationObject, artifacts: HookReturn[]): HookReturn[] => {
  const theme = getWordPressThemeObject();

  //#region colors
  
  const pallete: ColorPallete[] = [];
  const gradients: ColorGradient[] = [];

  documentationObject.design.color.forEach(color => {
    color.value.includes('-gradient')
      ? gradients.push({ name: color.name, slug: `${color.group}-${color.machineName}`, gradient: color.value })
      : pallete.push({ name: color.name, slug: `${color.group}-${color.machineName}`, color: color.value })
  })

  //#endregion colors

  //#region typography

  const typography = documentationObject.design.typography;
  const uniqueFontFamilies = Array.from((new Set(typography.map((type) => type.values.fontFamily))).values());
  const fontFamilies = uniqueFontFamilies.map((fontFamily) => {
    return {
      name: fontFamily,
      slug: Utils.slugify(fontFamily),
      fontFamily: fontFamily,
    }
  });

  const fontSizes = documentationObject.design.typography.map((type) => {
    return {
      name: type.name,
      slug: type.machine_name,
      size: `${type.values.fontSize}px`,
    }
  });

  const headings = typography.filter((item) => item.machine_name.includes('heading-')).map((item) => {
    // return object where key is item.machine_name and suboject is item.values.fontSize
    return {
      [item.machine_name.charAt(0) + item.machine_name.charAt(8)]: {
        typography: {
          fontSize: `${item.values.fontSize}px`,
          fontWeight: `${item.values.fontWeight}`
        },
        color: {
          text: item.values.color
        }
      }
    }
  });

  //#endregion typography

  //#region core/button

  const buttons = documentationObject.components.button
    .filter(button => {
      const variantProperties = new Map(button.variantProperties);
      return button.type === 'design' && variantProperties.get('Theme') === 'light' && variantProperties.get('State') !== 'disabled';
    })
    .map(button => {
      const variantProps = new Map(button.variantProperties);
      const rootTokenSets = button.parts?.$!;
      const background = rootTokenSets.filter((set): set is BackgroundTokenSet => set.name === 'BACKGROUND')[0]!;
      const fill = rootTokenSets.filter((set): set is FillTokenSet => set.name === 'FILL')[0]!;
      const typography = rootTokenSets.filter((set): set is TypographyTokenSet => set.name === 'TYPOGRAPHY')[0]!;
      const spacing = rootTokenSets.filter((set): set is SpacingTokenSet => set.name === 'SPACING')[0]!;
      const border = rootTokenSets.filter((set): set is BorderTokenSet => set.name === 'BORDER')[0]!;
      
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
          borderColor: (border.strokes[0] && border.strokes[0].color) ? transformFigmaFillsToCssColor(border.strokes, true).color : '',
          backgroundColor: transformFigmaFillsToCssColor(background.background).color,
          color: transformFigmaFillsToCssColor(fill.color, true).color,
        }
      }
    });

  const defaultStateButtons = buttons.filter(button => button.state === 'default');

  const buttonPallete = defaultStateButtons.map((item) => ({ name: `${item.type}`, slug: `${item.name}`, color: item.values.backgroundColor }));

  const buttonBackgroundPallete = buttons.map((item) => ({ name: `${item.type}`, slug: `${item.name}`, color: item.values.backgroundColor }));
  const buttonForegroundPallete = buttons.map((item) => ({ name: `${item.type}`, slug: `${item.name}`, color: item.values.color }));

  const custom = {
    button: {
        background: {}, 
        color: {}
    }
  }

  buttonBackgroundPallete.forEach(background => {
    custom.button.background[background.slug] = background.color;
  });

  buttonForegroundPallete.forEach(color => {
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
  theme.styles.elements = Object.assign({}, theme.styles.elements, ...headings);
  
  const data = JSON.stringify(theme, null, 2);

  //#endregion theme.json

  //#region functions.php
  const variantPattern = `
  register_block_style('core/button', [
		'name' => '$\{type\}',
		'label' => __('$\{name\}', 'handoff'),
	]);`

  const variants = defaultStateButtons.map(button => {
    return Utils.replaceTokens(variantPattern, new Map([
      ['name', `${startCase(button.type)} Button`],
      ['type', button.type],
    ]));
  });

  const patternsPattern = `
  register_block_pattern('handoff-block-patterns/button-$\{type\}', array(
    'title' => __('$\{name\}', 'handoff'),
    'description' => __('$\{name\} Button', 'handoff'),
    'content' => "<!-- wp:buttons -->\r\n<div class=\\"wp-block-buttons\\"><!-- wp:button {\\"className\\":\\"is-style-$\{type\}\\"} -->\r\n<div class=\\"wp-block-button is-style-$\{type\}\\"><a class=\\"wp-block-button__link wp-element-button\\">$\{name\}</a></div>\r\n<!-- /wp:button --></div>\r\n<!-- /wp:buttons -->",
    'categories' => array('button')
  ));`;

  const patterns = buttons.map(button => {
    return Utils.replaceTokens(patternsPattern, new Map([
      ['name', `${startCase(button.type)} Button`],
      ['type', button.type],
    ]));
  });

  // ====
  // BEGIN STYLES BY STYLE
  // ====
  const stylesPattern = `.wp-block-button.is-style-$\{type\} .wp-block-button__link$\{pseudoClass\} { border: $\{border\} !important; background: $\{backgroundColor\} !important; color: $\{color\} !important; }`
  const styles = buttons.map(button => {
    return Utils.replaceTokens(stylesPattern, new Map([
      ['type', button.type],
      ['state', button.state],
      // ['color', button.values.color],
      ['color', `var(--wp--custom--button--color--design-theme-${button.theme}-type-${button.type}-state-${button.state})`.toLowerCase()],
      // ['backgroundColor', button.values.backgroundColor],
      ['backgroundColor', `var(--wp--custom--button--background--design-theme-${button.theme}-type-${button.type}-state-${button.state})`.toLowerCase()],
      ['border', button.values.borderColor ? `${button.values.borderWeight}px solid ${button.values.borderColor}` : 'none'],
      ['pseudoClass', button.state === 'hover' ? ':hover': ''],
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

  const functionsFileContents: string = `<?php

  #region core/button variants
  add_action('init', function() {
    ${variants.join('\r\n')}
  });
  #endregion core/button variants
  
  #region core/button patterns
  function handoff_block_patterns() {
    ${patterns.join('\r\n')}
  }
  add_action('init', 'handoff_block_patterns');
  #endregion core/button patterns

  wp_enqueue_style('handoff-style', get_stylesheet_directory_uri() . '/handoff.css');

  function handoff_load_custom_wp_admin_style(){
    wp_register_style( 'handoff_wp_admin_css', get_stylesheet_directory_uri() . '/handoff.css');
    wp_enqueue_style( 'handoff_wp_admin_css' );
  }
  add_action('admin_enqueue_scripts', 'handoff_load_custom_wp_admin_style');
`;

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
      data,
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

const getWordPressThemeObject = () => {
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
          custom: {} as any,
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
}

const getButtonTypeStyles = (buttons: any[], type: string) => {
  const btnsOfType = buttons.filter(btn => btn.type === type);

  const defaultButton = btnsOfType.filter(btn => btn.state === 'default')[0];
  const hoverButton = btnsOfType.filter(btn => btn.state === 'hover')[0];

  return {
    border: {
      radius: `${defaultButton.values.borderRadius}px`,
      width: `${defaultButton.values.borderWeight}px`,
    },
    color: {
      background: defaultButton.values.backgroundColor,
      text: defaultButton.values.color,
    },
    spacing: {
      padding: {
        top: `${defaultButton.values.paddingTop}px`,
        right: `${defaultButton.values.paddingRight}px`,
        bottom: `${defaultButton.values.paddingBottom}px`,
        left: `${defaultButton.values.paddingLeft}px`,
      }
    },
    typography: {
      fontSize: `${defaultButton.values.fontSize}px`,
      fontWeight: `${defaultButton.values.fontWeight}`,
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
  }
}