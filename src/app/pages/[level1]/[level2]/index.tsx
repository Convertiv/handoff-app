import { buildL2StaticPaths, DocumentationProps, fetchDocPageMarkdown, IParams, reduceSlugToString } from '../../../components/util';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Header from '../../../components/Header';
import CustomNav from '../../../components/SideNav/Custom';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import { MarkdownComponents } from '../../../components/Markdown/MarkdownComponents';
import rehypeRaw from 'rehype-raw';
import getConfig from 'next/config';

export interface SubPageType {
  params: {
    level1: string;
    level2: string;
  };
}
/**
 * Render all index pages
 * @returns
 */
export async function getStaticPaths() {
  return {
    paths: buildL2StaticPaths(),
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
export const getStaticProps: GetStaticProps = async (context) => {
  // Read current slug
  const { level1 } = context.params as IParams;
  let { level2 } = context.params as IParams;
  if (!level2) {
    level2 = '404';
  }
  return {
    props: {
      ...fetchDocPageMarkdown(`docs/${level1}/`, reduceSlugToString(level2), `/${level1}`).props,
      config: getConfig(),
    },
  };
};

/**
 * Render Docs page
 * @param param0
 * @returns
 */
export default function DocSubPage({ content, menu, metadata, current, config }: DocumentationProps) {
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
            <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
              {content}
            </ReactMarkdown>
          </div>
        </section>
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
