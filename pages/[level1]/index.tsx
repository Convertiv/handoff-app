import Header from 'components/Header';
import CustomNav from 'components/SideNav/Custom';
import { buildL1StaticPaths, DocumentationProps, fetchDocPageMarkdown, IParams } from 'components/util';
import { getConfig } from 'config';
import * as fs from 'fs-extra';
import md from 'markdown-it';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import path from 'path';

/**
 * Render all index pages
 * @returns
 */
export async function getStaticPaths() {
  return {
    paths: buildL1StaticPaths(),
    fallback: true,
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
  return fetchDocPageMarkdown('docs/', level1, `/${level1}`);
};

const config = getConfig();

/**
 * Render Docs page
 * @param param0
 * @returns
 */
export default function DocPage({ content, menu, metadata, current }: DocumentationProps) {
  if (content) {
    const page = md().render(content);
    return (
      <div className="c-page">
        <Head>
          <title>{metadata.metaTitle}</title>
          <meta name="description" content={metadata.metaDescription} />
        </Head>
        <Header menu={menu} />
        {current?.subSections?.length > 0 && <CustomNav menu={current} />}
        <section className="c-content">
          <div className="o-container-fluid">
            <div className="c-hero">
              <div>
                <h1>{metadata.title}</h1>
                <p>{metadata.description}</p>
              </div>
            </div>
            <div dangerouslySetInnerHTML={{ __html: page }} />
          </div>
        </section>
      </div>
    );
  } else {
    <div className="c-page">Page Not Found</div>;
  }
}
