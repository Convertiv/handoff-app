import type { GetStaticProps } from 'next';
import Link from 'next/link';
import { getClientConfig } from '@handoff/config';
import Icon from '../../components/Icon';
import Head from 'next/head';
import { DocumentationProps, fetchDocPageMarkdown } from '../../components/util';
import Header from '../../components/old/Header';
import ReactMarkdown from 'react-markdown';
import CustomNav from '../../components/SideNav/Custom';
import { MarkdownComponents } from '../../components/Markdown/MarkdownComponents';
import rehypeRaw from 'rehype-raw';
import Footer from '../../components/Footer';
import Layout from '../../components/Layout/Main';
import HeaderH1 from '../../components/Typography/Headers';
import { AnchorNav } from '../../components/Navigation/AnchorNavNew';
import { Code2, Hexagon, Palette, PersonStanding, TypeOutline } from 'lucide-react';
import CardsWithIcons from '../../components/cards/CardsWithIcons';

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
        <HeaderH1>{metadata.title}</HeaderH1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{metadata.description}</p>
      </div>
      <div className="lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_280px]">
        <div>
          <CardsWithIcons
            items={[
              {
                title: 'Colors',
                description: 'Official logo used for all digital and offline materials.',
                icon: Palette,
                link: '/foundations/colors',
                cta: 'Explore Colors',
              },
              {
                title: 'Logos',
                description: `${config?.app?.client} logo used for all digital and offline materials.`,
                icon: Hexagon,
                link: '/foundations/logo',
                cta: 'Explore Logos',
              },
              {
                title: 'Typography',
                description: 'Typographic system with scale, sizes and color of text.',
                icon: TypeOutline,
                link: '/foundations/typography',
                cta: 'Explore Typography',
              },
            ]}
          />
        </div>
        <AnchorNav />
      </div>

      <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </Layout>
  );
};
export default DesignPage;
