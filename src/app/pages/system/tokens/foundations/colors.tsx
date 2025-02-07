import { ColorObject } from '@handoff/api';
import { getClientConfig } from '@handoff/config';
import { groupBy, upperFirst } from 'lodash';
import type { GetStaticProps } from 'next';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Layout from '../../../../components/Layout/Main';
import { MarkdownComponents } from '../../../../components/Markdown/MarkdownComponents';
import HeadersType from '../../../../components/Typography/Headers';
import { Table, TableBody, TableCell, TableRow } from '../../../../components/ui/table';
import { fetchComponents, fetchDocPageMarkdown, FoundationDocumentationProps, getTokens } from '../../../../components/util';

/**
 * This statically renders content from the markdown, creating menu and providing
 * metadata
 *
 * This is all done statically at build time
 * @param context GetStaticProps
 * @returns
 */
export const getStaticProps: GetStaticProps = async (context) => {
  // Read current slug
  const components = fetchComponents().map((c) => c.id);
  const config = getClientConfig();
  return {
    ...{
      props: {
        config,
        ...fetchDocPageMarkdown('docs/', 'system/tokens/foundations/colors', `/system`).props,
        design: getTokens().design,
      } as FoundationDocumentationProps,
    },
  };
};
/**
 * Define the components page
 * @param param0
 * @returns
 */
const ComponentsPage = ({ content, menu, metadata, current, config, design }: FoundationDocumentationProps) => {
  // Fetch components from api

  const colorGroups = Object.fromEntries(
    Object.entries(groupBy(design.color, 'group'))
      .map(([groupKey, colors]) => {
        return [
          groupKey,
          colors.map((colorObj) => {
            return {
              ...colorObj,
            };
          }),
        ] as const;
      })
      .sort(function (a, b) {
        const l = (config?.app?.color_sort ?? []).indexOf(a[0]) >>> 0;
        const r = (config?.app?.color_sort ?? []).indexOf(b[0]) >>> 0;
        return l !== r ? l - r : a[0].localeCompare(b[0]);
      })
  );

  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      <div className="flex flex-col gap-2 pb-7">
        <HeadersType.H1>{metadata.title}</HeadersType.H1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{metadata.description}</p>
      </div>
      <div className="mt-10">
        <ReactMarkdown className="prose" components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
          {content}
        </ReactMarkdown>

        {Object.keys(colorGroups).map((group) => (
          <div key={group} className="mb-8">
            <h3 className="mb-4 text-lg font-medium" id={`${group}-colors`}>
              {upperFirst(group)}
            </h3>
            <ColorGroupTable group={group} colors={colorGroups[group]} />
          </div>
        ))}
      </div>
    </Layout>
  );
};

const ColorGroupTable = ({ group, colors }: { group: string; colors: ColorObject[] }) => {
  return (
    <Table>
      <TableBody>
        {colors.map((color) => (
          <TableRow key={color.id} className="h-12">
            <TableCell>{color.reference}</TableCell>
            <TableCell className="w-7">
              <React.Fragment key={`group-${color.name}`}>
                <div
                  className="group relative block h-7 w-7 rounded-lg"
                  style={{ background: color.value ?? '', backgroundBlendMode: color.blend ?? '' }}
                ></div>
              </React.Fragment>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ComponentsPage;
