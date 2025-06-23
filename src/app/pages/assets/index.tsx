import { File, FileArchive } from 'lucide-react';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Footer from '../../components/Footer';
import { MarkdownComponents } from '../../components/Markdown/MarkdownComponents';
import NavLink from '../../components/NavLink';
import Header from '../../components/old/Header';
import { DocumentationProps, fetchDocPageMarkdown, getClientRuntimeConfig } from '../../components/util';

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
      ...fetchDocPageMarkdown('docs/', 'assets', `/assets`).props,
      config: getClientRuntimeConfig(),
    },
  };
};

const AssetsPage = ({ content, menu, metadata, current, config }: DocumentationProps) => {
  return (
    <div className="c-page">
      <Head>
        <title>{metadata.metaTitle}</title>
        <meta name="description" content={metadata.metaDescription} />
      </Head>
      <Header menu={menu} config={config} />
      <section className="c-content">
        <div className="o-container-fluid">
          <div className="c-hero c-hero--boxed c-hero--bg-red">
            <div>
              <h1 className="c-title--extra-large">{metadata.title}</h1>
              <p>{metadata.description}</p>
            </div>
          </div>

          <div className="o-row">
            <div className="o-col-6@md">
              <div className="c-card">
                <FileArchive />
                <h4>Logos</h4>
                <p>Official logo used for all digital and offline materials.</p>
                <p>
                  <NavLink href="/assets/logos">View Logos</NavLink>
                </p>
              </div>
            </div>
            <div className="o-col-6@md">
              <div className="c-card">
                <FileArchive />
                <h4>Fonts</h4>
                <p>Font family and weights for all {config?.app?.client} visuals.</p>
                <p>
                  <NavLink href="/assets/fonts">View Fonts</NavLink>
                </p>
              </div>
            </div>
            <div className="o-col-6@md">
              <div className="c-card">
                <File />
                <h4>Iconography</h4>
                <p>Library of approved vector iconography.</p>
                <p>
                  <NavLink href="/assets/icons">View Icons</NavLink>
                </p>
              </div>
            </div>
          </div>

          <div className="prose">
            <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </section>
      <Footer config={config} />
    </div>
  );
};
export default AssetsPage;
