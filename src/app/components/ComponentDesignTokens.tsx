import { ComponentInstance } from '@handoff/exporters/components/types';
import { transformComponentTokensToScssVariables } from '@handoff/transformers/scss/component';
import { Token } from '@handoff/transformers/types';
import { IntegrationObjectComponentOptions } from '@handoff/types/config';
import round from 'lodash/round';
import startCase from 'lodash/startCase';
import { Blend } from 'lucide-react';
import React, { useEffect } from 'react';
import { tokenReferenceFormat } from './util/token';

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

const IsColorValue = (value: string) => {
  return value.match(/^#[0-9A-F]{6}$/i) || value.match(/linear-gradient\(.*?\)|rgba\(.*?\)/);
};

const NormalizeValue = (value: string): string => {
  if (!Number.isNaN(Number(value))) {
    const numericValue = Number(value);
    if (numericValue % 1 != 0) {
      return round(numericValue, 2).toFixed(2);
    }
  }

  return value.replaceAll(/\d*\.\d+/g, (match) => round(Number(match), 2).toFixed(2));
};

export interface ComponentDesignTokensProps {
  title: string;
  previewObject: ComponentInstance;
  previewObjectOptions?: IntegrationObjectComponentOptions;
  componentInstances: ComponentInstance[];
  overrides?: { [variantProp: string]: string[] };
  children?: JSX.Element;
  renderPreviews: boolean;
  useReferences: boolean;
}

interface DataTableRow extends Map<string, [string, string, Token | undefined][]> {}
interface DataTable extends Map<string, DataTableRow> {}

export const ComponentDesignTokens: React.FC<ComponentDesignTokensProps> = ({
  title,
  componentInstances,
  previewObject,
  previewObjectOptions,
  overrides,
  children,
  renderPreviews,
  useReferences,
}) => {
  const previewObjectVariantPropsMap = new Map(previewObject.variantProperties);
  const [showReference, setShowReference] = React.useState(useReferences);
  const headings: Set<string> = new Set<string>();
  const dataTable = new Map() as DataTable;

  let numberOfColumns = 0;

  if (overrides) {
    const overrideVariantProps = Object.keys(overrides) ?? [];
    const masterOverride = overrideVariantProps[0];

    componentInstances
      // .sort((l, r) => {
      //   const lVal = l.variantProperties.find(val => val[0] === masterOverride)[1];
      //   const rVal = r.variantProperties.find(val => val[0] === masterOverride)[1];

      //   return state_sort.indexOf(lVal) - state_sort.indexOf(rVal);
      // })
      .forEach((component) => {
        const componentVariantPropsMap = new Map(component.variantProperties);

        for (const [variantProp, value] of component.variantProperties) {
          if (!overrideVariantProps.includes(variantProp) && value !== previewObjectVariantPropsMap.get(variantProp)) {
            return null;
          }
        }

        for (const overrideVariantProp of overrideVariantProps) {
          if (!overrides[overrideVariantProp].includes(componentVariantPropsMap.get(overrideVariantProp))) {
            return null;
          }
        }

        // Set values for the component
        transformComponentTokensToScssVariables(component, previewObjectOptions).forEach((token) => {
          // Initialize part if not already initialized
          dataTable.get(token.metadata.part) ?? dataTable.set(token.metadata.part, new Map() as DataTableRow);
          // Initialize property for part if not already initialized
          dataTable.get(token.metadata.part).get(token.metadata.cssProperty) ??
            dataTable.get(token.metadata.part).set(token.metadata.cssProperty, []);
          // Append the value for the part property
          dataTable
            .get(token.metadata.part)
            .get(token.metadata.cssProperty)
            .push([token.name, token.value, token ?? undefined]);
        });

        // Increase columns count
        numberOfColumns++;

        // Append heading to the list of headings
        headings.add(componentVariantPropsMap.get(masterOverride));
      });
  } else {
    // Set values for the component
    transformComponentTokensToScssVariables(previewObject, previewObjectOptions).forEach((token) => {
      // Initialize part if not already initialized
      dataTable.get(token.metadata.part) ?? dataTable.set(token.metadata.part, new Map() as DataTableRow);
      // Initialize property for part if not already initialized
      dataTable.get(token.metadata.part).get(token.metadata.cssProperty) ??
        dataTable.get(token.metadata.part).set(token.metadata.cssProperty, []);
      // Append the value for the part property
      dataTable
        .get(token.metadata.part)
        .get(token.metadata.cssProperty)
        .push([token.name, token.value, token ?? undefined]);
    });

    // Increase columns count
    numberOfColumns++;

    // Append heading to the list of headings
    headings.add('Value');
  }

  if (!componentInstances || componentInstances.length === 0) {
    return <></>;
  }

  const layoutLeftColWidth = renderPreviews ? (numberOfColumns >= 7 ? 11 : 4 + numberOfColumns) : 12;
  const layoutRightColWidth = 12 - layoutLeftColWidth;

  return (
    <div key={`${previewObject.id}`} className="o-col-12@md c-tokens-preview u-mb-5">
      <div key={`${previewObject.id}__title`} id={previewObject.id}>
        <h4>{title}</h4>
        {useReferences && (
          <div className="c-tokens-preview__actions u-flex u-justify-end">
            <input type="checkbox" id="showReference" checked={showReference} onChange={() => setShowReference(!showReference)} />
            Show Reference
          </div>
        )}
      </div>
      <hr />
      <div className="o-row">
        <div className={`o-col-${layoutLeftColWidth}@md`}>
          <div className="c-tokens-preview__row">
            <p>
              <strong>Property</strong>
            </p>
            {Array.from(headings).map((heading) => (
              <p key={`${previewObject.id}-*-*-${heading}__title`}>
                <strong>{startCase(heading)}</strong>
              </p>
            ))}
          </div>

          {Array.from(dataTable).map(([part, propertiesMap], rowIdx) => (
            <React.Fragment key={`${previewObject.id}-${part}`}>
              {rowIdx > 0 && (
                <>
                  <br />
                  <p>
                    <strong>{startCase(part.replaceAll('-', ' '))}</strong>
                  </p>
                </>
              )}
              {Array.from(propertiesMap)
                .sort(([lProp], [rProp]) => lProp.localeCompare(rProp))
                .map(([prop, cells]) => (
                  <div key={`${previewObject.id}-${part}-${prop}-row`} className="c-tokens-preview__row">
                    <p>{prop}</p>

                    {cells.map(([tokenName, tokenValue, tokenReference], i) => (
                      <>
                        <PropertyStateValue
                          key={`${previewObject.id}-${part}-${prop}-${i}`}
                          property={prop}
                          variable={tokenName}
                          value={tokenValue}
                          tokenReference={tokenReference}
                          showReference={showReference}
                        />
                      </>
                    ))}
                  </div>
                ))}
            </React.Fragment>
          ))}
        </div>
        {renderPreviews && (
          <div className={`o-col-${layoutRightColWidth}@md`}>
            <div key={`${previewObject.id}`} id={previewObject.id} className="c-component-preview--sticky">
              <div className="c-component-preview">{children}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PropertyStateValue: React.FC<{
  property: string;
  variable: string;
  value: string;
  tokenReference: Token;
  showReference: boolean;
}> = ({ property, variable, value, tokenReference, showReference = false }) => {
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
      {IsColorValue(value) && (
        <div className="c-token-preview__color">
          <span style={{ background: value }}></span>
        </div>
      )}
      <PropertyIcon name={property} />
      <p>
        {!showReference ? (
          NormalizeValue(value)
        ) : tokenReference ? (
          <>{tokenReferenceFormat(tokenReference, 'generic')} </>
        ) : (
          NormalizeValue(value)
        )}
      </p>
    </div>
  );
};

const PropertyIcon: React.FC<{ name: string }> = ({ name }) => {
  const icon = PropertyIconPathMap[name];
  // TODO Map the icon to the correct icon
  switch (name) {
    case 'border-width':
      return <Blend />;

    default:
      return <Blend />;
  }
};

export default ComponentDesignTokens;
