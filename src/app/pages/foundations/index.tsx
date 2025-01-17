import HeadersType from '@/components/Typography/Headers';
import { getClientConfig } from '@handoff/config';
import { Grid, Hexagon, Palette, Pickaxe, TypeOutline } from 'lucide-react';
import type { GetStaticProps } from 'next';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import CardsWithIcons from '../../components/Cards/CardsWithIcons';
import Layout from '../../components/Layout/Main';
import { MarkdownComponents } from '../../components/Markdown/MarkdownComponents';
import { DocumentationProps, fetchDocPageMarkdown } from '../../components/util';

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
      ...fetchDocPageMarkdown('docs/', 'foundations', `/foundations`).props,
      config: getClientConfig(),
    },
  };
};

const DesignPage = ({ content, menu, metadata, current, config }: DocumentationProps) => {
  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      <div className="flex flex-col gap-2 pb-7">
        <HeadersType.H1>{metadata.title}</HeadersType.H1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{metadata.description}</p>
      </div>
      <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
      <div>
        <CardsWithIcons
          items={[
            {
              title: 'Logos',
              description: `${config?.app?.client} logo used for all digital and offline materials.`,
              icon: Hexagon,
              link: '/foundations/logo',
              cta: 'Explore Logos',
            },
            {
              title: 'Colors',
              description: 'Official logo used for all digital and offline materials.',
              icon: Palette,
              link: '/foundations/colors',
              cta: 'Explore Colors',
            },
            {
              title: 'Typography',
              description: 'Typographic system with scale, sizes and color of text.',
              icon: TypeOutline,
              link: '/foundations/typography',
              cta: 'Explore Typography',
            },
            {
              title: 'Grid',
              description: 'How should pages be laid out, with spacing, breakpoints, and device sizes.',
              icon: Grid,
              link: '/foundations/grid',
              cta: 'Explore Grid',
            },
            {
              title: 'Icons',
              description: 'How should pages be laid out, with spacing, breakpoints, and device sizes.',
              icon: Pickaxe,
              link: '/foundations/icons',
              cta: 'Explore Grid',
            },
          ]}
        />
      </div>
    </Layout>
  );
};
export default DesignPage;
