import { ComponentDocumentationOptions } from '@handoff/types';
import { Types as CoreTypes } from 'handoff-core';
import { round, startCase } from 'lodash';
import React from 'react';
import { ComponentPreview, getComponentPreviewTitle } from '../../../../../components/Component/Preview';
import Layout from '../../../../../components/Layout/Main';
import HeadersType from '../../../../../components/Typography/Headers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../components/ui/table';
import {
  ComponentDocumentationProps,
  fetchCompDocPageMarkdown,
  fetchComponents,
  getClientRuntimeConfig,
  getTokens,
  IParams,
  reduceSlugToString,
  staticBuildMenu,
} from '../../../../../components/util';
import { getComponentInstanceScssTokens, tokenReferenceFormat } from '../../../../../components/util/token';
import { filterOutNull } from '../../../../../lib/utils';

/**
 * Render all index pages
 * @returns
 */
export async function getStaticPaths() {
  return {
    paths: fetchComponents()?.map((exportable) => ({ params: { component: exportable.id } })) ?? [],
    fallback: false, // can also be true or 'blocking'
  };
}

export const getStaticProps = async (context) => {
  const { component } = context.params as IParams;
  // get previews for components on this page
  const menu = staticBuildMenu();
  const config = getClientRuntimeConfig();
  const componentSlug = reduceSlugToString(component);
  const tokens = getTokens();
  const componentObject = tokens?.components?.[componentSlug!] ?? null;

  return {
    props: {
      id: component,
      component: componentObject ?? {},
      menu,
      config,
      ...fetchCompDocPageMarkdown('docs/', `/system/${componentSlug}`, `/system`).props,
    },
  };
};

const GenericComponentPage = ({
  menu,
  metadata,
  current,
  id,
  config,
  component,
  options,
  componentOptions,
}: ComponentDocumentationProps) => {
  const tokensTabComponents = getComponentPreviews('tokens', component, options);
  if (!tokensTabComponents) return <p>Loading...</p>;
  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      <div className="flex flex-col gap-2 pb-7">
        <HeadersType.H1>{metadata.title}</HeadersType.H1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{metadata.description}</p>
      </div>
      <div className="mt-10">
        {tokensTabComponents.map((previewComponent) => {
          return (
            <ComponentDesignTokens
              key={previewComponent.component.id}
              title={getComponentPreviewTitle(previewComponent)}
              previewObject={previewComponent.component}
              previewObjectOptions={componentOptions}
              componentInstances={component?.instances}
              overrides={previewComponent.overrides}
              renderPreviews={false}
              useReferences={config.useVariables ?? false}
            ></ComponentDesignTokens>
          );
        })}
      </div>
    </Layout>
  );
};

export const getComponentPreviews = (
  tab: 'overview' | 'tokens',
  component: CoreTypes.IFileComponentObject,
  options: ComponentDocumentationOptions
) => {
  const instances = component.instances;
  const view = (options?.views ?? {})[tab] ?? {};
  const viewFilters = view.condition ?? {};
  const viewSort = view.sort ?? [];

  if (!instances) return [];
  let tabComponents: ComponentPreview[] = instances
    .map((componentInstance) => {
      const filterProps = Object.keys(viewFilters);
      const variantProps = new Map(componentInstance.variantProperties);

      let overrides: { states?: string[] } | undefined = undefined;
      let name: string = /*hasPreviews*/ false
        ? componentInstance.variantProperties.filter((variantProp) => !filterProps.includes(variantProp[0]))[0]?.[1]
        : componentInstance.variantProperties.map(([variantProp, value]) => `${variantProp}: ${startCase(value)}`).join(', ');

      for (const filterProp of filterProps) {
        if (!variantProps.get(filterProp)) {
          continue;
        }

        const filterValue = viewFilters[filterProp];

        if (typeof filterValue === 'object' && filterValue !== null) {
          if (Array.isArray(filterValue)) {
            // Filter value is a array so we check if the value of the respective component property
            // is contained in the filter value array
            if (!filterValue.includes(variantProps.get(filterProp))) {
              // Filter value array does not contain the value of the respective component property
              // Since component should not be displayed we return null value
              return null;
            }
            // Use as a default possibly distinctive name
            name ??= variantProps.get(filterProp);
          } else {
            // Filter value is a object so we check if the value of the respective component property
            // is contained within the array of object keys
            if (!Object.keys(filterValue).includes(variantProps.get(filterProp))) {
              // Filter value object keys do not contain the value of the respective component property
              // Since component should not be displayed we return null value
              return null;
            } else {
              // Filter value object keys do contain the value of the respective component property
              // We will store the property value of the filter value object for later use
              overrides = filterValue[variantProps.get(filterProp)];
              // Use as a default possibly distinctive name
              name ??= variantProps.get(filterProp);
            }
          }
        } else if (typeof filterValue === 'string' && variantProps.get(filterProp) !== filterValue) {
          return null;
        }
      }

      return {
        component: componentInstance,
        name: /*hasPreviews*/ false
          ? `${startCase(name)} ${startCase(componentInstance.name)}`
          : `${startCase(componentInstance.name)} (${name})`,
        overrides,
      };
    })
    .filter(filterOutNull);

  if (viewSort.length > 0) {
    tabComponents = multiPropSort(viewSort, tabComponents);
  }

  return tabComponents;
};

function multiPropSort(properties: string[], array: ComponentPreview[]) {
  return array.sort((l, r) => {
    for (const prop of properties) {
      const lVal = new Map(l.component.variantProperties).get(prop);
      const rVal = new Map(r.component.variantProperties).get(prop);

      if (!lVal || lVal === '') {
        return 1; // Move items with undefined or empty string values to the last
      } else if (!rVal || rVal === '') {
        return -1; // Move items with undefined or empty string values to the last
      }

      if (lVal < rVal) {
        return -1;
      } else if (lVal > rVal) {
        return 1;
      }
    }
    return 0; // Objects are considered equal if all properties are equal
  });
}

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
  previewObject: CoreTypes.IComponentInstance;
  previewObjectOptions?: CoreTypes.IHandoffConfigurationComponentOptions;
  componentInstances: CoreTypes.IComponentInstance[];
  overrides?: { [variantProp: string]: string[] };
  children?: React.ReactNode;
  renderPreviews: boolean;
  useReferences: boolean;
}

interface DataTableRow extends Map<string, [string, string, CoreTypes.IToken | undefined][]> {}
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

    componentInstances.forEach((component) => {
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
      getComponentInstanceScssTokens(component, previewObjectOptions).forEach((token) => {
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
    getComponentInstanceScssTokens(previewObject, previewObjectOptions).forEach((token) => {
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
  const headingsTotal = Array.from(headings).length + 1;

  return (
    <>
      <h3 className="mb-4 text-lg font-medium">{title}</h3>
      <Table className="mb-8">
        <TableHeader>
          <TableRow>
            <TableHead>Property</TableHead>
            {Array.from(headings).map((heading) => (
              <TableHead key={`${previewObject.id}_table_heading_${heading}`}>
                <strong>{startCase(heading)}</strong>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from(dataTable).map(([part, propertiesMap], rowIdx) => (
            <React.Fragment key={`${previewObject.id}_fragment_${rowIdx}`}>
              {rowIdx > 0 && (
                <TableRow key={`${previewObject.id}_table_group_row_${rowIdx}`} className="h-12">
                  <TableCell colSpan={headingsTotal}>
                    <strong>{startCase(part.replaceAll('-', ' '))}</strong>
                  </TableCell>
                </TableRow>
              )}

              {Array.from(propertiesMap)
                .sort(([lProp], [rProp]) => lProp.localeCompare(rProp))
                .map(([prop, cells], i) => (
                  <TableRow key={`${previewObject.id}_table_tokens_row_${rowIdx}_${i}`} className="h-12">
                    <TableCell>
                      {/* <p>{prop}</p> */}
                      {cells[0][0]}
                    </TableCell>

                    {cells.map(([_, tokenValue, tokenReference], i) => (
                      <TableCell key={`${previewObject.id}_table_tokens_row_${rowIdx}_${i}_cell_${i}`}>
                        {/* {IsColorValue(tokenValue) && (
                          <div className="group relative inline-block h-7 w-7 rounded-lg" style={{ background: tokenValue }}></div>
                        )} */}
                        {/* <PropertyIcon name={property} /> */}
                        {!showReference ? (
                          NormalizeValue(tokenValue)
                        ) : tokenReference ? (
                          <>{tokenReferenceFormat(tokenReference, 'css')} </>
                        ) : (
                          NormalizeValue(tokenValue)
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default GenericComponentPage;
