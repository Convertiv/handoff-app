import { Types as CoreTypes } from 'handoff-core';
import HtmlReactParser from 'html-react-parser';
import { Code, Download, Share } from 'lucide-react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import * as React from 'react';
import Footer from '../../../../components/Footer';
import Layout from '../../../../components/Layout/Main';
import HeadersType from '../../../../components/Typography/Headers';
import { buttonVariants } from '../../../../components/ui/button';
import { AssetDocumentationProps, fetchDocPageMarkdown, getClientRuntimeConfig, getTokens } from '../../../../components/util';

const DisplayIcon: React.FC<{ icon: CoreTypes.IAssetObject }> = ({ icon }) => {
  const htmlData = React.useMemo(() => {
    // For SSR
    if (typeof window === 'undefined') {
      return icon.data.replace('<svg', '<svg class="o-icon"');
    }

    const element = document.createElement('div');
    element.innerHTML = icon.data;

    const svgElement = element.querySelector('svg');

    if (!svgElement) return '';

    svgElement.classList.add('o-icon');

    return svgElement.outerHTML;
  }, [icon.data]);

  return <>{HtmlReactParser(htmlData)}</>;
};

/**
 * Render all index pages
 * @returns
 */
export async function getStaticPaths() {
  const paths = getTokens().assets.icons.map((icon) => ({
    params: {
      name: icon.name,
    },
  }));

  return {
    paths,
    fallback: false,
  };
}

/**
 * This statically renders content from the markdown, creating menu and providing
 * metadata
 *
 * This is all done statically at build time
 * @param context GetStaticProps
 * @returns
 */
export const getStaticProps: GetStaticProps = (context) => {
  return {
    props: {
      ...fetchDocPageMarkdown('docs/foundations/', 'icons', `/foundations`).props,
      config: getClientRuntimeConfig(),
      assets: getTokens().assets,
    },
  };
};

export default function SingleIcon({ content, menu, metadata, current, config, assets }: AssetDocumentationProps) {
  const router = useRouter();
  let { name } = router.query;
  const icon = assets?.icons.find((icon) => icon.icon === name);
  const copySvg = React.useCallback<React.MouseEventHandler>(
    (event) => {
      event.preventDefault();
      if (icon) {
        navigator.clipboard.writeText(icon.data);
      }
    },
    [icon]
  );

  if (!menu) {
    menu = [];
  }

  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      {!icon ? (
        <div>404 Icon Not Found</div>
      ) : (
        <div>
          <div className="flex flex-row justify-between gap-2">
            <HeadersType.H1 className="font-mono text-xl">{icon.name}</HeadersType.H1>
            <div className="flex flex-row flex-wrap items-center gap-4">
              <small className="font-mono">{icon.size}b</small>
              <small>/</small>
              <Link className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' font-normal [&_svg]:!size-3'} href="#">
                Share Asset <Share strokeWidth={1.5} />
              </Link>

              <Link
                onClick={copySvg}
                className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' font-normal [&_svg]:!size-3'}
                href="#"
              >
                Copy SVG <Code strokeWidth={1.5} />
              </Link>

              <Link
                href={'data:text/plain;charset=utf-8,' + encodeURIComponent(icon.data)}
                download={icon.name}
                className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' font-normal [&_svg]:!size-3'}
              >
                Download SVG <Download strokeWidth={1.5} />
              </Link>
            </div>
          </div>

          <hr className="my-10" />

          <div className="@container">
            <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2">
              <div className="dotted-bg flex items-center justify-center py-12 md:min-h-60">
                <div className="scale-[4]">
                  <DisplayIcon icon={icon} />
                </div>
              </div>

              <div className="flex h-full flex-col gap-4">
                <div className="flex flex-1 items-center justify-center rounded-md border-gray-200 bg-gray-100 p-4">
                  <DisplayIcon icon={icon} />
                </div>
                <div className="flex flex-1 items-center justify-center rounded-md border-gray-800 bg-gray-900 p-4">
                  <DisplayIcon icon={icon} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer config={config} />
    </Layout>
  );
}
