import * as React from 'react';
import type { GetStaticProps } from 'next';
import groupBy from 'lodash/groupBy';
import upperFirst from 'lodash/upperFirst';
import { getClientConfig } from '@handoff/config';
import * as util from '../../components/util';
import AnchorNav from '../../components/Navigation/AnchorNav';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import { MarkdownComponents } from '../../components/Markdown/MarkdownComponents';
import rehypeRaw from 'rehype-raw';
import { DownloadTokens } from '../../components/DownloadTokens';
import { getTokens } from '../../components/util';
import Layout from '../../components/Layout/Main';
import HeaderH1 from '../..//components/Typography/Headers';
import ColorGrid from '../..//components/Foundations/ColorGrid';

/**
 * This statically renders content from the markdown, creating menu and providing
 * metadata
 *
 * This is all done statically at build time
 * @param context GetStaticProps
 * @returns
 */
export const getStaticProps: GetStaticProps = async (context) => {
  return {
    props: {
      ...util.fetchFoundationDocPageMarkdown('docs/foundations/', 'colors', `/foundations`).props,
      config: getClientConfig(),
      design: getTokens().design,
    },
  };
};

const ColorsPage = ({
  content,
  menu,
  metadata,
  current,
  scss,
  css,
  styleDictionary,
  types,
  design,
  config,
}: util.FoundationDocumentationProps) => {
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
    <Layout config={config} menu={menu} metadata={metadata} current={current}>
      <div className="flex flex-col gap-2 pb-7">
        <HeaderH1>{metadata.title}</HeaderH1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{metadata.description}</p>
        <DownloadTokens componentId="colors" scss={scss} css={css} styleDictionary={styleDictionary} types={types} />
      </div>
      <div className="lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_280px]">
        <div>
          {Object.keys(colorGroups).map((group) => (
            <ColorGrid
              title={upperFirst(group)}
              description="Colors that are used most frequently across all pages and components."
              colors={colorGroups[group]}
              key={group}
            />
          ))}
        </div>

        <AnchorNav
          groups={[
            Object.assign({}, ...[...Object.keys(colorGroups).map((group) => ({ [`${group}-colors`]: `${upperFirst(group)} Colors` }))]),
          ]}
        />

        <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
          {content}
        </ReactMarkdown>
      </div>
    </Layout>
  );
};
export default ColorsPage;
