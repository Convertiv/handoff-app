import { buildL2StaticPaths, DocumentationProps, fetchDocPageMarkdown, getCurrentSection, IParams } from 'components/util';

import * as fs from 'fs-extra';
import md from 'markdown-it';
import { GetStaticProps } from 'next';
import path from 'path';
import { filterOutUndefined } from 'components/util';
import { getConfig } from 'config';
import Head from 'next/head';
import Header from 'components/Header';
import CustomNav from 'components/SideNav/Custom';

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
  return fetchDocPageMarkdown(`docs/${level1}/`, level2, `/${level1}`);
};

const config = getConfig();

/**
 * Render Docs page
 * @param param0
 * @returns
 */
export default function DocSubPage({ content, menu, metadata, current }: DocumentationProps) {
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
