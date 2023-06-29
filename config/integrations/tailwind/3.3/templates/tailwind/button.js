const filterOutUndefined = (value) => value !== undefined;
const getTypesFromComponents = (components) => {
  return Array.from(
    new Set(
      components.map((component) => component.type).filter(filterOutUndefined)
    )
  );
};
const getStatesFromComponents = (components) => {
  return Array.from(
    new Set(
      components.map((component) => component.state).filter(filterOutUndefined)
    )
  );
};
const getThemesFromComponents = (components) => {
  return Array.from(
    new Set(
      components.map((component) => component.theme).filter(filterOutUndefined)
    )
  );
};
const getSizesFromComponents = (components) => {
  return Array.from(
    new Set(
      components.map((component) => component.size).filter(filterOutUndefined)
    )
  );
};
/**
 * Returns a list of Tailwind CSS classes for each component
 */
const buttonRender = (buttons) => {
  const types = getTypesFromComponents(buttons);
  const sizes = getSizesFromComponents(buttons);
  const rendered = {};
  types.map((type) => {
    rendered[`.btn-${type}`] = buttonTemplate(type)
  });
  sizes.map((size) => {
    rendered[`.btn-${size}`] = buttonTemplate(size)
  });
  return rendered;
};

const buttonTemplate = (type) => {
    return {
        background: `var(--button-${type}-background)`,
        color: `var(--button-${type}-color)`,
        paddingTop: `var(--button-${type}-padding-top)`,
        paddingRight: `var(--button-${type}-padding-right)`,
        paddingBottom: `var(--button-${type}-padding-bottom)`,
        paddingLeft: `var(--button-${type}-padding-left)`,
        borderWidth: `var(--button-${type}-border-width)`,
        borderRadius: `var(--button-${type}-border-radius)`,
        borderColor: `var(--button-${type}-border-color)`,
        fontFamily: `var(--button-${type}-font-family)`,
        fontSize: `var(--button-${type}-font-size)`,
        fontWeight: `var(--button-${type}-font-weight)`,
        lineHeight: `var(--button-${type}-line-height)`,
        letterSpacing: `var(--button-${type}-letter-spacing)`,
        textAlign: `var(--button-${type}-text-align)`,
        textDecoration: `var(--button-${type}-text-decoration)`,
        textTransform: `var(--button-${type}-text-transform)`,
        boxShadow: `var(--button-${type}-box-shadow)`,
        opacity: `var(--button-${type}-opacity)`,
        "&:hover": {
          background: `var(--button-${type}-hover-background)`,
          color: `var(--button-${type}-hover-color)`,
          paddingTop: `var(--button-${type}-hover-padding-top)`,
          paddingRight: `var(--button-${type}-hover-padding-right)`,
          paddingBottom: `var(--button-${type}-hover-padding-bottom)`,
          paddingLeft: `var(--button-${type}-hover-padding-left)`,
          borderWidth: `var(--button-${type}-hover-border-width)`,
          borderRadius: `var(--button-${type}-hover-border-radius)`,
          borderColor: `var(--button-${type}-hover-border-color)`,
          fontFamily: `var(--button-${type}-hover-font-family)`,
          fontSize: `var(--button-${type}-hover-font-size)`,
          fontWeight: `var(--button-${type}-hover-font-weight)`,
          lineHeight: `var(--button-${type}-hover-line-height)`,
          letterSpacing: `var(--button-${type}-hover-letter-spacing)`,
          textAlign: `var(--button-${type}-hover-text-align)`,
          textDecoration: `var(--button-${type}-hover-text-decoration)`,
          textTransform: `var(--button-${type}-hover-text-transform)`,
          boxShadow: `var(--button-${type}-hover-box-shadow)`,
          opacity: `var(--button-${type}-hover-opacity)`,
        },
      };
}

module.exports = buttonRender;
