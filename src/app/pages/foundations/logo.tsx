import * as React from 'react';
import type { GetStaticProps } from 'next';
import Link from 'next/link';
import type { AssetObject } from '@handoff/types';
import { getClientConfig } from '@handoff/config';
import Icon from '../../components/Icon';
import Head from 'next/head';
import { AssetDocumentationProps, fetchDocPageMarkdown, getTokens } from '../../components/util';
import Header from '../../components/Header';
import CustomNav from '../../components/SideNav/Custom';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import { MarkdownComponents } from '../../components/Markdown/MarkdownComponents';
import rehypeRaw from 'rehype-raw';
import Footer from '../../components/Footer';

const DisplayLogo: React.FC<{ logo: AssetObject; content?: string }> = ({ logo, content }) => {
  const htmlData = React.useMemo(() => {
    // For SSR
    if (typeof window === 'undefined') {
      return logo.data.replace('<svg', '<svg class="o-icon c-logo-preview"');
    }

    const element = document.createElement('div');
    element.innerHTML = logo.data;

    const svgElement = element.querySelector('svg');

    if (!svgElement) return '';

    svgElement.classList.add('o-icon', 'c-logo-preview');

    return svgElement.outerHTML;
  }, [logo.data]);

  return (
    <div className="u-mb-5">
      <div className="u-mb-2" dangerouslySetInnerHTML={{ __html: htmlData }} />
      <small>
        {content} {logo.description}.
      </small>
    </div>
  );
};
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
      ...fetchDocPageMarkdown('docs/foundations/', 'logo', `/foundations`).props,
      config: getClientConfig(),
      assets: getTokens().assets,
    },
  };
};

const LogoPage = ({ content, menu, metadata, current, config, assets }: AssetDocumentationProps) => {
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
          <div className="c-hero">
            <div>
              <h1>{metadata.title}</h1>
              <p>{metadata.description}</p>
            </div>
            {metadata.image && <Icon name={metadata.image} className="c-hero__img c-hero__img--small" />}
          </div>

          <div className="o-row">
            <div className="o-col-10@md">
              <div>
                <h4>Logo Variations</h4>
                <p>There is one main {config?.app?.client} logo that supports two variations.</p>
              </div>
            </div>
          </div>
          <div className="o-row">
            <div className="o-col-12@md">
              <div className="o-stack-2@md o-stack-2@lg u-mb-n-4">
                {assets.logos.map((logo) => (
                  <DisplayLogo logo={logo} content={config?.app?.client} key={logo.path} />
                ))}
              </div>
            </div>
          </div>
          <hr />

          <div className="o-row u-justify-between">
            <div className="o-col-5@md">
              <h4>Download Assets</h4>
              <p>Keep the appearance of the logo conistent. Do not modify it or alter the orientation.</p>
            </div>
            <div className="o-col-6@md">
              <div className="c-card">
                <Icon name="file-zip" className="c-card__icon" />
                <h4>Logos</h4>
                <p>Official logo used for all digital and offline materials.</p>
                <p>
                  <Link href="/assets/logos">Download Logos</Link>
                </p>
              </div>
            </div>
          </div>
          <hr />
        </div>
        <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
          {content}
        </ReactMarkdown>
      </section>
      <Footer config={config} />
    </div>
  );
};
export default LogoPage;
