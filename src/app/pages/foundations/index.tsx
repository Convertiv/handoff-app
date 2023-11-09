import type { GetStaticProps } from 'next';
import Link from 'next/link';
import { getConfig } from '../../../config';
import Icon from '../../components/Icon';
import Head from 'next/head';
import { DocumentationProps, fetchDocPageMarkdown } from '../../components/util';
import Header from '../../components/Header';
import ReactMarkdown from 'react-markdown';
import CustomNav from '../../components/SideNav/Custom';
import { MarkdownComponents } from '../../components/Markdown/MarkdownComponents';
import rehypeRaw from 'rehype-raw';

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
      config: getConfig(),
    }
  }
};

const DesignPage = ({ content, menu, metadata, current, config }: DocumentationProps) => {
  return (
    <div className="c-page">
      <Head>
        <title>{metadata.metaTitle}</title>
        <meta name="description" content={metadata.metaDescription} />
      </Head>
      <Header menu={menu} config={config} />
      {current.subSections.length > 0 && <CustomNav menu={current} />}
      <section className="c-content">
        <div className="o-container-fluid">
          <div className="c-hero c-hero--boxed c-hero--bg-yellow">
            <div>
              <h1 className="c-title--extra-large">{metadata.title}</h1>
              <p>{metadata.description}</p>
            </div>
            {metadata.image && <Icon name={metadata.image} className="c-hero__img c-hero__img--small" />}
          </div>

          <div className="o-row">
            <div className="o-col-6@md">
              <div className="c-card">
                <h4>Colors</h4>
                <p>Official logo used for all digital and offline materials.</p>
                <p>
                  <a href="#"></a>
                </p>
                <p>
                  <Link href="/foundations/colors">Explore Colors</Link>
                </p>
              </div>
            </div>
            <div className="o-col-6@md">
              <div className="c-card">
                <h4>Logos</h4>
                <p>{config?.app?.client} logo used for all digital and offline materials.</p>
                <p>
                  <Link href="/foundations/logo">Explore Logos</Link>
                </p>
              </div>
            </div>
            <div className="o-col-6@md">
              <div className="c-card">
                <h4>Typography</h4>
                <p>Typographic system with scale, sizes and color of text.</p>
                <p>
                  <Link href="/foundations/typography">Explore Typography</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};
export default DesignPage;
