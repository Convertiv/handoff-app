import { TypographyObject } from '@handoff/api';
import { getClientConfig } from '@handoff/config';
import { upperFirst } from 'lodash';
import type { GetStaticProps } from 'next';
import React, { ReactElement } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Layout from '../../../../components/Layout/Main';
import { MarkdownComponents } from '../../../../components/Markdown/MarkdownComponents';
import AnchorNav from '../../../../components/Navigation/AnchorNav';
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
        ...fetchDocPageMarkdown('docs/', 'system/tokens/foundations/typography', `/system`).props,
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
  const typography = design.typography.slice().sort((a, b) => {
    const l = (config?.app?.type_sort ?? []).indexOf(a.name) >>> 0;
    const r = (config?.app?.type_sort ?? []).indexOf(b.name) >>> 0;
    return l !== r ? l - r : a.name.localeCompare(b.name);
  });

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
          <FontsTable types={typography} />
        </div>
        <AnchorNav
          groups={[Object.assign({}, ...[...typography.map((type) => ({ [`${type.name}-typography`]: `${upperFirst(type.name)}` }))])]}
        />
      </div>
    </Layout>
  );
};

const FontsTable = ({ types }: { types: TypographyObject[] }) => {
  return types.map((type, index) => {
    const reference = type.reference.replace(/-+/g, '-');
    return (
      <React.Fragment key={`type-hier-${index}`}>
        <h3 className="mb-4 text-lg font-medium">{upperFirst(type.name)}</h3>
        <Table className="mb-8 border-b-[0.5px] border-l-[0.5px] border-r-[0.5px] border-t-[0.5px]">
          <TableBody>
            <TableRow className="h-10 border-b-[0.5px]">
              <TableCell className="border-r-[0.5px] px-3.5 py-1">{reference}-font-family</TableCell>
              <TableCell className="border-r-[0.5px] px-3.5 py-1 text-right">{type.values.fontFamily}</TableCell>
            </TableRow>
            <TableRow className="h-10 border-b-[0.5px]">
              <TableCell className="border-r-[0.5px] px-3.5 py-1">{reference}-font-size</TableCell>
              <TableCell className="border-r-[0.5px] px-3.5 py-1 text-right">{type.values.fontSize}px</TableCell>
            </TableRow>
            <TableRow className="h-10 border-b-[0.5px]">
              <TableCell className="border-r-[0.5px] px-3.5 py-1">{reference}-font-weight</TableCell>
              <TableCell className="border-r-[0.5px] px-3.5 py-1 text-right">{type.values.fontWeight}</TableCell>
            </TableRow>
            <TableRow className="h-10 border-b-[0.5px]">
              <TableCell className="border-r-[0.5px] px-3.5 py-1">{reference}-font-height</TableCell>
              <TableCell className="border-r-[0.5px] px-3.5 py-1 text-right">
                {(type.values.lineHeightPx / type.values.fontSize).toFixed(1)}
              </TableCell>
            </TableRow>
            <TableRow className="h-10 border-b-[0.5px]">
              <TableCell className="border-r-[0.5px] px-3.5 py-1">{reference}-letter-spacing</TableCell>
              <TableCell className="border-r-[0.5px] px-3.5 py-1 text-right">{type.values.letterSpacing}</TableCell>
            </TableRow>
            <TableRow className="h-10 border-b-[0.5px]">
              <TableCell className="border-r-[0.5px] px-3.5 py-1">{reference}-paragraph-spacing</TableCell>
              <TableCell className="border-r-[0.5px] px-3.5 py-1 text-right">{type.values.paragraphSpacing | 20}px</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </React.Fragment>
    );
  });
};

export const pluckStyle = (type: TypographyObject) => {
  return {
    fontFamily: type.values.fontFamily,
    fontSize: type.values.fontSize,
    fontWeight: type.values.fontWeight,
    lineHeight: type.values.lineHeightPx + 'px',
  };
};

export interface typographyTypes {
  [key: string]: ReactElement;
}

export default ComponentsPage;
