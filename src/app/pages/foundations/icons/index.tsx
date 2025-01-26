import { getClientConfig } from '@handoff/config';
import type { AssetObject } from '@handoff/types';
import { Laptop, Search } from 'lucide-react';
import type { GetStaticProps } from 'next';
import Link from 'next/link';
import * as React from 'react';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import rehypeRaw from 'rehype-raw';
import Footer from '../../../components/Footer';
import Layout from '../../../components/Layout/Main';
import { MarkdownComponents } from '../../../components/Markdown/MarkdownComponents';
import HeadersType from '../../../components/Typography/Headers';
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

    svgElement.classList.add('o-icon');

    return svgElement.outerHTML;
  }, [icon.data]);

  return (
    <div>
      <Link href={`/foundations/icons/${icon.icon}`}>
        <div className="c-card c-card--icon-preview">
          <div dangerouslySetInnerHTML={{ __html: htmlData }} />
          <p>{icon.icon}</p>
        </div>
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

  const icons = search
    ? assets.icons.filter((icon) => {
        return icon.index.includes(search);
      })
    : assets.icons;

  const filterList = React.useCallback<React.ChangeEventHandler<HTMLInputElement>>((event) => {
    setSearch(event.currentTarget.value.toLowerCase().replace(/[\W_]+/g, ' '));
  }, []);

  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      <div className="flex flex-col gap-2 pb-7">
        <HeadersType.H1>{metadata.title}</HeadersType.H1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{metadata.description}</p>
        <a href={config?.assets_zip_links?.icons ?? '/icons.zip'}>Download All Icons</a>
      </div>
      <ReactMarkdown className="prose" components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>

      <div className="c-form-element c-form-element--fullwidth c-form-element--big">
        <div className="c-form-element__field">
          <div className="c-form-element__icon">
            <Search />
          </div>
          <input type="text" className="c-form-element__text" placeholder="Search icons..." onChange={filterList} />
        </div>
      </div>
      <p>
        <strong>{icons.length}</strong> found
      </p>
      <div className="o-row">
        <div className="o-col-12@md">
          <div className="o-stack-3@md o-stack-5@lg">
            {icons.length > 0 ? (
              icons.map((icon) => <DisplayIcon key={icon.path} icon={icon} />)
            ) : (
              <div className="c-search-results">
                <Laptop />
                <h4>No icons found.</h4>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer config={config} />
    </Layout>
  );
};
export default IconsPage;
