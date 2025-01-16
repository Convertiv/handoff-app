import * as React from 'react';
import type { GetStaticProps } from 'next';
import Link from 'next/link';
import type { AssetObject } from '@handoff/types';
import { getClientConfig } from '@handoff/config';

import { AssetDocumentationProps, fetchDocPageMarkdown, getTokens } from '../../components/util';

import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import { MarkdownComponents } from '../../components/Markdown/MarkdownComponents';
import rehypeRaw from 'rehype-raw';
import Layout from '../../components/Layout/Main';
import HeaderH1 from '../../components/Typography/Headers';
import { FileArchive } from 'lucide-react';

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
    <Layout config={config} menu={menu} metadata={metadata} current={current}>
      <div className="flex flex-col gap-2 pb-7">
        <HeaderH1>{metadata.title}</HeaderH1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{metadata.description}</p>
      </div>
      <div className="mt-10">
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
              <FileArchive />
              <h4>Logos</h4>
              <p>Official logo used for all digital and offline materials.</p>
              <p>
                <Link href="/assets/logos">Download Logos</Link>
              </p>
            </div>
          </div>
        </div>
        <hr />

        <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
          {content}
        </ReactMarkdown>
      </div>
    </Layout>
  );
};
export default LogoPage;
