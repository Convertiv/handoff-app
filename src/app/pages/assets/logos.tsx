import { getClientConfig } from '@handoff/config';
import { FileArchive } from 'lucide-react';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import rehypeRaw from 'rehype-raw';
import Footer from '../../components/Footer';
import { MarkdownComponents } from '../../components/Markdown/MarkdownComponents';
import Header from '../../components/old/Header';
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
      ...fetchDocPageMarkdown('docs/assets/', 'logos', `/assets`).props,
      config: getClientConfig(),
    },
  };
};

const AssetsLogosPage = ({ content, menu, metadata, current, config }: DocumentationProps) => {
  return (
    <div className="c-page">
      <Head>
        <title>{metadata.metaTitle}</title>
        <meta name="description" content={metadata.metaDescription} />
      </Head>
      <Header menu={menu} config={config} />
      <section className="c-content">
        <div className="o-container-fluid">
          <div className="c-hero">
            <div>
              <h1>{metadata.title}</h1>
              <p>{metadata.description}</p>
            </div>
          </div>
          <div className="o-row u-justify-between">
            <div className="o-col-5@md">
              <h4>{config?.app?.client} Logo</h4>
            </div>
            <div className="o-col-6@md">
              <div className="c-card">
                <FileArchive />
                <h4>{config?.app?.client} Logo</h4>
                <p>Vector files of approved {config?.app?.client} logos.</p>
                <p>
                  <a href={config?.assets_zip_links?.logos ?? '/logos.zip'}>Download Logos</a>
                </p>
              </div>
            </div>
          </div>
          <ReactMarkdown className="prose" components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
            {content}
          </ReactMarkdown>
          <hr />
        </div>
      </section>
      <Footer config={config} />
    </div>
  );
};
export default AssetsLogosPage;
