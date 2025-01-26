import { getClientConfig } from '@handoff/config';
import type { AssetObject } from '@handoff/types';
import type { GetStaticProps } from 'next';
import Link from 'next/link';
import * as React from 'react';

import { AssetDocumentationProps, fetchDocPageMarkdown, getTokens } from '../../components/util';

import { FileArchive } from 'lucide-react';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import rehypeRaw from 'rehype-raw';
import Layout from '../../components/Layout/Main';
import { MarkdownComponents } from '../../components/Markdown/MarkdownComponents';
import HeadersType from '../../components/Typography/Headers';

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
        <HeadersType.H1>{metadata.title}</HeadersType.H1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{metadata.description}</p>
      </div>

      <div>
        <HeadersType.H2>Logo Variations</HeadersType.H2>
        <p className="mb-8">There is one main {config?.app?.client} logo that supports two variations.</p>
      </div>

      {assets.logos.map((logo) => (
        <DisplayLogo logo={logo} content={config?.app?.client} key={logo.path} />
      ))}
      <hr />

      <div className="o-row u-justify-between">
        <div className="o-col-5@md">
          <HeadersType.H2>Download Assets</HeadersType.H2>
          <p className="mb-8">Keep the appearance of the logo consistent. Do not modify it or alter the orientation.</p>
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

      <ReactMarkdown className="prose" components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </Layout>
  );
};
export default LogoPage;
