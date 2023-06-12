import startCase from 'lodash/startCase.js';
import sortBy from 'lodash/sortBy.js';
import round from 'lodash/round.js';
import React, { useEffect } from 'react';
import Icon from './Icon';
import { ExportableTransformerOptions } from '../../types';
import { transformComponentTokensToScssVariables } from '../../transformers/scss/component';
import { ComponentDesign } from '../../exporters/components/extractor';

type PreviewObjectDefinition = {id: string, type?: string, activity?: string};
type StateValueMap = { [k: string]: { variable: string, value: string } }
type PropertyStatesMap = { [k: string]: StateValueMap } 
type PropertyStateMapGroups = { [k: string]: PropertyStatesMap }

const UndefinedAsString = String(undefined);
const FallbackState = UndefinedAsString;

const PropertyIconPathMap = {
  'border-width': 'token-border-width',
  'border-radius': 'token-border-radius',
  'font-family': 'token-type-small',
  'padding-top': 'token-spacing-vertical',
  'padding-bottom': 'token-spacing-vertical',
  'padding-left': 'token-spacing-horizontal',
  'padding-right': 'token-spacing-horizontal',
  'text-align': 'token-alignment',
} as { [k: string]: string };

const IsHexValue = (value: string) => value.match(/^#[0-9A-F]{6}$/i);

const NormalizeValue = (value: string): string => {
  if (!Number.isNaN(Number(value))) {
    const numericValue = Number(value);
    if (numericValue % 1 != 0) {
      return round(numericValue, 2).toFixed(2);
    }
  }

  const rgbaValue = value.match(/(.*?)rgba\(([0-9]+), ([0-9]+), ([0-9]+), [+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)\)/);

  if (rgbaValue && rgbaValue.length === 7) {
    return `${rgbaValue[1]}rgba(${rgbaValue[2]}, ${rgbaValue[3]}, ${rgbaValue[4]}, ${round(Number(rgbaValue[5]), 2).toFixed(2)})`;
  }

  return value;
};

const state_sort = ['default', 'hover', 'focus', 'active', 'disabled'];

interface ComponentDesignTokensOverrides {
  states?: string[];
}

export interface ComponentDesignTokensProps {
  title: string,
  previewObject: PreviewObjectDefinition,
  transformerOptions: ExportableTransformerOptions,
  designComponents: ComponentDesign[],
  overrides?: ComponentDesignTokensOverrides,
  children?: JSX.Element,
}

export const ComponentDesignTokens: React.FC<ComponentDesignTokensProps> = ({ transformerOptions, title, designComponents, previewObject, overrides, children }) => {
  const componentsOfType = designComponents.filter(
    (component) =>
      component.type === previewObject.type &&
      component.activity === previewObject.activity &&
      (component.theme === 'light' || !component.theme)
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

  const propertiesOfType = Object.entries(transformComponentTokensToScssVariables(componentsOfType[0], transformerOptions)).map(([_, r]) => `${r.group}\\${r.property}`);

  const propertiesWithStatesOfType: PropertyStatesMap = propertiesOfType.reduce(
    (prev, next) => ({ ...prev, [next]: statesOfType.reduce((prev, next) => ({ ...prev, [next]: {} }), {}) }),
    {}
  );

  statesOfType.forEach((state) => {
    const componentOfState = componentsOfType.find((component) => component.state === state || (state === FallbackState && !component.state));
    Object.entries(transformComponentTokensToScssVariables(componentOfState!, transformerOptions)).forEach(([l, r]) => {
      propertiesWithStatesOfType[`${r.group}\\${r.property}`][state].variable = l;
      propertiesWithStatesOfType[`${r.group}\\${r.property}`][state].value = r.value;
    });
  });

  const designTokenGroups: PropertyStateMapGroups = Array.from(new Set(propertiesOfType.map((p) => p.split('\\')[0])).values()).reduce(
    (prev, next) => {
      return {
        ...prev,
        [next]: propertiesOfType
          .filter((prop) => prop.startsWith(`${next}\\`))
          .reduce((prev, next) => {
            return { ...prev, [next.split(`\\`)[1]]: propertiesWithStatesOfType[next] };
          }, {}),
      };
    },
    {}
  );

  const hasSingleDesignTokensGroup = Object.entries(designTokenGroups).length === 1;

  const layoutLeftColWidth = statesOfType.length >= 7 ? 11 : 4 + statesOfType.length;
  const layoutRightColWidth = 12 - layoutLeftColWidth;

  return (
    <div key={`${previewObject.type}`} className="o-col-12@md c-tokens-preview u-mb-5">
      <div key={`${previewObject.id}__title`} id={previewObject.id}>
        <h4>{title}</h4>
      </div>
      <hr />
      <div className="o-row">
        <div className={`o-col-${layoutLeftColWidth}@md`}>
          <div className="c-tokens-preview__row">
            <p>
              <strong>Property</strong>
            </p>
            {statesOfType.map((state) => (
              <p key={`${previewObject.type}-*-*-${state}__title`}>
                <strong>{state !== FallbackState ? startCase(state) : 'Value'}</strong>
              </p>
            ))}
          </div>

          {Object.entries(designTokenGroups).map(([group, propsWithStateMaps]) => {
            const props = sortBy(Object.keys(propsWithStateMaps));
            return (
              <React.Fragment key={`${previewObject.type}-${group}`}>
                {!hasSingleDesignTokensGroup && (
                  <>
                    <br />
                    <p>
                      <strong>{startCase(group.replaceAll('-', ' '))}</strong>
                    </p>
                  </>
                )}
                {props.map((prop) => {
                  const stateMap = propsWithStateMaps[prop];
                  return (
                    <div key={`${previewObject.type}-${group}-${prop}-row`} className="c-tokens-preview__row">
                      <p>{prop}</p>
                      {Object.entries(stateMap).map(([state, { variable, value }]) => (
                        <PropertyStateValue
                          key={`${previewObject.type}-${variable}-${state}`}
                          property={prop}
                          variable={variable}
                          value={value}
                        />
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
        <div className={`o-col-${layoutRightColWidth}@md`}>
          <div key={`${previewObject.id}`} id={previewObject.id} className="c-component-preview--sticky">
            <div className="c-component-preview">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PropertyStateValue: React.FC<{ property: string; variable: string; value: string }> = ({ property, variable, value }) => {
  const [tooltip, setTooltip] = React.useState(variable);

  useEffect(() => {
    if (tooltip !== variable) {
      const tooltipResetTimer = setTimeout(() => setTooltip(variable), 2000);
      return () => clearTimeout(tooltipResetTimer);
    }
  }, [tooltip, variable]);

  return (
    <div
      className="c-token-preview c-tooltip"
      data-tooltip={tooltip}
      onClick={(e) => {
        e.preventDefault();
        if (window) {
          navigator.clipboard.writeText(variable);
          setTooltip('Copied to clipboard!');
        }
      }}
    >
      {IsHexValue(value) && (
        <div className="c-token-preview__color">
          <span style={{ backgroundColor: value }}></span>
        </div>
      )}
      <PropertyIcon name={property} />
      <p>{NormalizeValue(value)}</p>
    </div>
  );
};

const PropertyIcon: React.FC<{ name: string }> = ({ name }) => {
  const icon = PropertyIconPathMap[name];
  return icon !== undefined ? <Icon name={icon} className="" /> : <></>;
};

export default ComponentDesignTokens;
