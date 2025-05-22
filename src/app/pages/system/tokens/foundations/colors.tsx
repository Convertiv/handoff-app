import { Types as CoreTypes } from 'handoff-core';
import { groupBy, upperFirst } from 'lodash';
import type { GetStaticProps } from 'next';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Layout from '../../../../components/Layout/Main';
import { MarkdownComponents } from '../../../../components/Markdown/MarkdownComponents';
import AnchorNav from '../../../../components/Navigation/AnchorNav';
import HeadersType from '../../../../components/Typography/Headers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import {
  fetchComponents,
  fetchDocPageMarkdown,
  FoundationDocumentationProps,
  getClientRuntimeConfig,
  getTokens,
} from '../../../../components/util';

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
  const config = getClientRuntimeConfig();
  return {
    ...{
      props: {
        config,
        ...fetchDocPageMarkdown('docs/', 'system/tokens/foundations/colors', `/system`).props,
        design: getTokens().localStyles,
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
      <div className="mt-10 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_280px]">
        <div>
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

        <AnchorNav
          groups={[
            Object.assign({}, ...[...Object.keys(colorGroups).map((group) => ({ [`${group}-colors`]: `${upperFirst(group)} Colors` }))]),
          ]}
        />
      </div>
    </Layout>
  );
};

const ColorGroupTable = ({ group, colors }: { group: string; colors: CoreTypes.IColorObject[] }) => {
  return (
    <Table className="border-b-[0.5px] border-l-[0.5px] border-r-[0.5px]">
      <TableHeader className="border-b-0 border-l-[0.5px] border-r-[0.5px] border-t-[0.5px] bg-gray-50/80 dark:bg-gray-800/80 ">
        <TableRow className="!border-b-[0.5px]">
          <TableHead className="border-r-[0.5px] px-4 text-xs font-light text-gray-900 dark:text-gray-100">Name</TableHead>
          <TableHead className="border-r-[0.5px] px-4 text-xs font-light text-gray-900 dark:text-gray-100">Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {colors.map((color) => (
          <TableRow key={color.id} className="h-10 border-b-[0.5px]">
            <TableCell className="border-r-[0.5px] px-3.5 py-1">{color.reference}</TableCell>
            <TableCell className="border-r-[0.5px] px-3.5 py-1">
              <div className="flex items-center gap-2">
                <span
                  className="group relative block h-4 w-4 rounded-full"
                  style={{ background: color.value ?? '', backgroundBlendMode: color.blend ?? '' }}
                ></span>
                <code className="text-xs">{color.value}</code>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ComponentsPage;
