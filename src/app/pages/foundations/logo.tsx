import { getClientConfig } from '@handoff/config';
import type { GetStaticProps } from 'next';
import Link from 'next/link';

import { AssetDocumentationProps, fetchDocPageMarkdown, getTokens } from '../../components/util';

import { DisplayLogo } from '@/components/Foundations/DisplayLogo';
import { buttonVariants } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import rehypeRaw from 'rehype-raw';
import Layout from '../../components/Layout/Main';
import { MarkdownComponents } from '../../components/Markdown/MarkdownComponents';
import HeadersType from '../../components/Typography/Headers';

/**
 *         <div className="flex flex-col gap-5">
          <img src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/assets/images/usage-wrong.png`} alt="Usage Cards" className="rounded-3xl" />
          <div className="flex flex-row gap-4">
            <img src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/assets/images/x-circle.svg`} alt="Do" className="h-6 w-6" />
            <p className="leading-normal text-gray-500">Do not tilt the logo or mirror it in any way.</p>
          </div>
        </div>
    <div className="u-mb-5">
      <div className="u-mb-2" dangerouslySetInnerHTML={{ __html: htmlData }} />
      <small>
        {content} {logo.description}.
      </small>
    </div>
 */
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
        <div className="mt-3 flex flex-row gap-3">
          <Link
            className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' font-normal [&_svg]:!size-3'}
            href={config?.assets_zip_links?.logos ?? '/logos.zip'}
          >
            Download Logos <Download strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      <div>
        <HeadersType.H2>Logo Variations</HeadersType.H2>
        <p className="mb-8">There is one main {config?.app?.client} logo that supports two variations.</p>
      </div>
      <div className="mb-8 grid grid-cols-2 gap-6">
        {assets.logos.map((logo) => (
          <DisplayLogo logo={logo} content={config?.app?.client} key={logo.path} />
        ))}
      </div>
      <hr />
      <hr />

      <ReactMarkdown className="prose" components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </Layout>
  );
};
export default LogoPage;
