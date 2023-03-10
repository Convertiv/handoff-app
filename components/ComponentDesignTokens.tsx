import { ValueProperty } from 'figma-exporter/src/transformers/scss/types';
import { round, startCase } from 'lodash';
import React, { useEffect } from 'react';
import Icon from './Icon';

type DesignComponentDefinition = {type?: string, theme?: string, state?: string, horizontal?: string, vertical?: string};
type PreviewObjectDefinition = {id: string, type?: string};
type StateValueMap = { [k: string]: { variable: string, value: string } }
type PropertyStatesMap = { [k: string]: StateValueMap } 
type PropertyStateMapGroups = { [k: string]: PropertyStatesMap }

const UndefinedAsString = String(undefined);
const FallbackState = UndefinedAsString;

const PropertyIconPathMap = {
  'border-width'  : 'token-border-width',
  'border-radius'  : 'token-border-radius',
  'font-family'    : 'token-type-small',
  'padding-top'    : 'token-spacing-vertical',
  'padding-bottom' : 'token-spacing-vertical',
  'padding-left'   : 'token-spacing-horizontal',
  'padding-right'  : 'token-spacing-horizontal',
  'text-align'     : 'token-alignment'
} as {[k: string]: string}

const IsHexValue = (value: string) => value.match(/^#[0-9A-F]{6}$/i);

const NormalizeValue = (value: string): string => {
  if (!Number.isNaN(Number(value))) {
    const numericValue = Number(value);
    if (numericValue % 1 != 0) {
      return round(numericValue, 2).toFixed(2);
    }
  }

  const rgbaValue = value.match(
    /(.*?)rgba\(([0-9]+), ([0-9]+), ([0-9]+), [+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)\)/
  );
  
  if (rgbaValue && rgbaValue.length === 7) {
    return `${rgbaValue[1]}rgba(${rgbaValue[2]}, ${rgbaValue[3]}, ${rgbaValue[4]}, ${round(Number(rgbaValue[5]), 2).toFixed(2)})`;
  }

  return value;
}

const state_sort = ['default', 'hover', 'focus', 'active', 'disabled'];

interface ComponentDesignTokensOverrides {
  states?: string[]
}

export interface ComponentDesignTokensProps {
  transformer: (params: any) => Record<string, ValueProperty>,
  componentName: string,
  designComponents: DesignComponentDefinition[],
  previewObject: PreviewObjectDefinition,
  overrides?: ComponentDesignTokensOverrides,
  children?: JSX.Element,
  layout?: { cols?: { left: number; right: number; } }
}

export const ComponentDesignTokens: React.FC<ComponentDesignTokensProps> = ({ transformer, componentName, designComponents, previewObject, overrides, layout, children }) => {
  const componentsOfType = designComponents.filter(
    (component) => component.type === previewObject.type && (component.theme === 'light' || !component.theme)
  );

  if (!componentsOfType || componentsOfType.length === 0) {
    return <></>;
  }

  const statesOfType = componentsOfType
    .map((component) => String(component.state))
    .filter((state) => !((overrides?.states?.length ?? 0) > 0 && !overrides?.states?.includes(state)))
    .sort((prev, next) => {
      let l = (overrides?.states ?? state_sort).indexOf(prev) >>> 0;
      let r = (overrides?.states ?? state_sort).indexOf(next) >>> 0;
      return (l !== r) ? l - r : prev.localeCompare(next);
    })
  ;

  const propertiesOfType = Object.entries(transformer(componentsOfType[0])).map(([_, r]) => `${r.group}\\${r.property}`);

  const propertiesWithStatesOfType: PropertyStatesMap = propertiesOfType.reduce((prev, next) => (
    {...prev, [next]: statesOfType.reduce((prev, next) => (
      {...prev, [next]: {}}
    ), {})
  }), {});
  
  statesOfType.forEach((state) => {
    const componentOfState = componentsOfType.find((component) => component.state === state || (state === FallbackState && !component.state));
    Object.entries(transformer(componentOfState!)).forEach(([l, r]) => {
      propertiesWithStatesOfType[`${r.group}\\${r.property}`][state].variable = l;
      propertiesWithStatesOfType[`${r.group}\\${r.property}`][state].value = r.value
    });
  });

  const designTokenGroups: PropertyStateMapGroups = Array.from(new Set(propertiesOfType.map((p) => (p.split('\\')[0]))).values())
    .reduce((prev, next) => {
      const bar = propertiesOfType
        .filter((prop) => prop.startsWith(`${next}\\`))
        .reduce((prev, next) => {
          return {...prev, [next.split(`\\`)[1]]: propertiesWithStatesOfType[next]}
        }, {});
      return {...prev, [next]: bar}
    }, {});

  const hasSingleDesignTokensGroup = Object.entries(designTokenGroups).length === 1;

  return (
    <div key={`${previewObject.type}`} className="o-col-12@md c-tokens-preview u-mb-5">
      <div key={`${previewObject.id}__title`} id={previewObject.id}>
        <h4>{startCase(previewObject.type)}{ componentName ? ` ${componentName}` : '' }</h4>
      </div>
      <hr />
      <div className="o-row">
        <div className={`o-col-${layout?.cols?.left ?? 7}@md`}>
          <div className="c-tokens-preview__row">
            <p><strong>Property</strong></p>
            {statesOfType.map((state) => (
              <p key={`${previewObject.type}-*-*-${state}__title`}>
                <strong>{state !== FallbackState ? startCase(state) : 'Value'}</strong>
              </p>
            ))}
          </div>

          {Object.entries(designTokenGroups).map(([group, propsWithStateMaps]) => (
            <React.Fragment key={`${previewObject.type}-${group}`}>
              {!hasSingleDesignTokensGroup && (
                <>
                  <br />
                  <p><strong>{startCase(group.replaceAll('-', ' '))}</strong></p>
                </>
              )}
              {Object.entries(propsWithStateMaps).map(([property, stateMap]) => (
                <div key={`${previewObject.type}-${group}-${property}-row`} className="c-tokens-preview__row">
                  <p>{property}</p>
                  {Object.entries(stateMap).map(([state, {variable, value}]) => (
                    <PropertyStateValue
                      key={`${previewObject.type}-${variable}-${state}`}
                      property={property}
                      variable={variable}
                      value={value}
                    />
                  ))}
                </div>
              ))}
            </React.Fragment>
          ))}
          
        </div>
        <div className={`o-col-${layout?.cols?.right ?? 5}@md`}>
          <div key={`${previewObject.id}`} id={previewObject.id} className="c-component-preview--sticky">
            <div className="c-component-preview">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PropertyStateValue: React.FC<{property: string, variable: string, value: string}> = ({property, variable, value}) => {
  const [tooltip, setTooltip] = React.useState(variable);

  useEffect(() => {
    if (tooltip !== variable) {
      const tooltipResetTimer = setTimeout(() => setTooltip(variable), 2000);
      return () => clearTimeout(tooltipResetTimer);
    }
  }, [tooltip, variable])

  return (
    <div className="c-token-preview c-tooltip" data-tooltip={tooltip} onClick={(e) => {
      e.preventDefault();
      if (window) {
        navigator.clipboard.writeText(variable);
        setTooltip('Copied to clipboard!');
      }
    }}>
      {IsHexValue(value) && (
        <div className="c-token-preview__color">
          <span style={{backgroundColor: value}}></span>
        </div>
      )}
      <PropertyIcon name={property} />
      <p>{NormalizeValue(value)}</p>
    </div>
  );
}

const PropertyIcon: React.FC<{ name: string }> = ({ name }) => {
  const icon = PropertyIconPathMap[name];
  return icon !== undefined ? <Icon name={icon} className="" /> : <></>;
};

export default ComponentDesignTokens;
