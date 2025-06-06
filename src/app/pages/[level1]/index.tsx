import { getClientConfig } from '@handoff/config';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import rehypeRaw from 'rehype-raw';
import Footer from '../../components/Footer';
import { MarkdownComponents } from '../../components/Markdown/MarkdownComponents';
import Header from '../../components/old/Header';
import CustomNav from '../../components/SideNav/Custom';
import { buildL1StaticPaths, DocumentationProps, fetchDocPageMarkdown, IParams, reduceSlugToString } from '../../components/util';

/**
 * Render all index pages
 * @returns
 */
export async function getStaticPaths() {
  return {
    paths: buildL1StaticPaths(),
    fallback: false,
  };
}

/**
 * Get all the markdown data, build a menu tree, and then fetch the contents
 * of the current page for rendering
 *
 * This is all done statically at build time
 * @param context GetStaticProps
 * @returns
 */
export const getStaticProps: GetStaticProps = (context) => {
  // Read current slug
  const { level1 } = context.params as IParams;
  return {
    props: {
      ...fetchDocPageMarkdown('docs/', reduceSlugToString(level1), `/${level1}`).props,
      config: getClientConfig(),
    },
  };
};

/**
 * Render Docs page
 * @param param0
 * @returns
 */
export default function DocPage({ content, menu, metadata, current, config }: DocumentationProps) {
  if (content) {
    return (
      <div className="c-page">
        <Head>
          <title>{metadata.metaTitle}</title>
          <meta name="description" content={metadata.metaDescription} />
        </Head>
        <Header menu={menu} config={config} />
        {current?.subSections?.length > 0 && <CustomNav menu={current} />}
        <section className="c-content">
          <div className="o-container-fluid">
            <div className="c-hero">
              <div>
                <h1>{metadata.title}</h1>
                <p>{metadata.description}</p>
              </div>
            </div>
            <ReactMarkdown className="prose" components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
              {content}
            </ReactMarkdown>
          </div>
        </section>
        <Footer config={config} />
      </div>
    );
  } else {
    return (
      <div className="c-page">
        <Head>
          <title>Page Not Found</title>
          <meta name="description" content="Page Not found" />
        </Head>
        Page Not Found
      </div>
    );
  }
}
