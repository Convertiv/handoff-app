import { getClientConfig } from '@handoff/config';
import type { AssetObject } from '@handoff/types';
import { Download } from 'lucide-react';
import type { GetStaticProps } from 'next';
import Link from 'next/link';
import * as React from 'react';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import rehypeRaw from 'rehype-raw';
import Footer from '../../../components/Footer';
import Layout from '../../../components/Layout/Main';
import { MarkdownComponents } from '../../../components/Markdown/MarkdownComponents';
import HeadersType from '../../../components/Typography/Headers';
import { buttonVariants } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { AssetDocumentationProps, fetchDocPageMarkdown, getTokens } from '../../../components/util';

export const DisplayIcon: React.FC<{ icon: AssetObject }> = ({ icon }) => {
  const htmlData = React.useMemo(() => {
    // For SSR
    if (typeof window === 'undefined') {
      return icon.data.replace('<svg', '<svg class="o-icon"');
    }

    const element = document.createElement('div');
    element.innerHTML = icon.data;

    const svgElement = element.querySelector('svg');

    if (!svgElement) return '';

    return svgElement.outerHTML;
  }, [icon.data]);

  return (
    <div className="flex flex-col gap-2">
      <Link href={`/foundations/icons/${icon.icon}`}>
        <div className="flex flex-col items-center gap-6 rounded-lg border border-gray-100/80 bg-gray-100/80 py-12 transition-all hover:border-gray-300 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 dark:hover:bg-gray-900">
          <div dangerouslySetInnerHTML={{ __html: htmlData }} />
        </div>
      </Link>
      <Link href={`/foundations/icons/${icon.icon}`}>
        <p className="font-mono text-[11px]">{icon.icon}</p>
      </Link>
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
      ...fetchDocPageMarkdown('docs/foundations/', 'icons', `/foundations`).props,
      config: getClientConfig(),
      assets: getTokens().assets,
    },
  };
};

const IconsPage = ({ content, menu, metadata, current, config, assets }: AssetDocumentationProps) => {
  const [search, setSearch] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const icons = search
    ? assets.icons.filter((icon) => {
        return icon.index.includes(search);
      })
    : assets.icons;

  const filterList = React.useCallback<React.ChangeEventHandler<HTMLInputElement>>((event) => {
    setSearch(event.currentTarget.value.toLowerCase().replace(/[\W_]+/g, ' '));
  }, []);

  const handleKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setSearch('');
      // Prevent the default ESC behavior (which can blur input in some browsers)
      event.preventDefault();
    }
  }, []);

  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      <div className="flex flex-col gap-2 pb-7">
        <HeadersType.H1>{metadata.title}</HeadersType.H1>
        <p className="max-w-[800px] text-lg font-light text-gray-500 dark:text-gray-300">{metadata.description}</p>
        <div className="mt-3 flex flex-row gap-3">
          <Link
            className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' font-normal [&_svg]:!size-3'}
            href={config?.assets_zip_links?.icons ?? '/icons.zip'}
          >
            Download Icons <Download strokeWidth={1.5} />
          </Link>
        </div>
      </div>
      <hr className="mb-10" />
      <ReactMarkdown className="prose" components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>

      <Input
        type="text"
        placeholder="Search icons..."
        onChange={filterList}
        onKeyDown={handleKeyDown}
        value={search}
        ref={inputRef}
        className="px-5 py-6 text-lg"
      />
      <p className="my-5 text-sm text-gray-600 dark:text-gray-300">
        <span className="font-medium text-gray-900 dark:text-gray-100">{icons.length}</span> found
      </p>

      {icons.length > 0 ? (
        <div className="@container">
          <div className="grid grid-cols-1 gap-5 @sm:grid-cols-2 @xl:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-5">
            {icons.map((icon) => (
              <DisplayIcon key={icon.path} icon={icon} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex min-h-[200px] items-center justify-center">
          <h4 className="text-lg font-light text-gray-600 dark:text-gray-300">No icons found.</h4>
        </div>
      )}

      <Footer config={config} />
    </Layout>
  );
};
export default IconsPage;
