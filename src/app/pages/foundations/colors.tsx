import groupBy from 'lodash/groupBy';
import upperFirst from 'lodash/upperFirst';
import type { GetStaticProps } from 'next';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import ColorGrid from '../..//components/Foundations/ColorGrid';
import { DownloadTokens } from '../../components/DownloadTokens';
import Layout from '../../components/Layout/Main';
import { MarkdownComponents } from '../../components/Markdown/MarkdownComponents';
import AnchorNav from '../../components/Navigation/AnchorNav';
import PrevNextNav from '../../components/Navigation/PrevNextNav';
import HeadersType from '../../components/Typography/Headers';
import * as util from '../../components/util';
import { getTokens } from '../../components/util';

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
      config: util.getClientRuntimeConfig(),
      design: getTokens().localStyles,
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
        <HeadersType.H1>{metadata.title}</HeadersType.H1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{metadata.description}</p>
        <DownloadTokens componentId="colors" scss={scss} css={css} styleDictionary={styleDictionary} types={types} />
      </div>
      <div className="lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-0">
          {Object.keys(colorGroups).map((group) => (
            <ColorGrid
              title={upperFirst(group)}
              group={group}
              description="Colors that are used most frequently across all pages and components."
              colors={colorGroups[group]}
              key={group}
            />
          ))}
          <PrevNextNav previous={null} next={{ title: 'Typography', href: '/foundations/typography' }} />
        </div>

        <AnchorNav
          groups={[
            Object.assign({}, ...[...Object.keys(colorGroups).map((group) => ({ [`${group}-colors`]: `${upperFirst(group)} Colors` }))]),
          ]}
        />

        <div className="prose">
          <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </Layout>
  );
};
export default ColorsPage;
