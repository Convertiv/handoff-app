import * as React from 'react';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import rehypeRaw from 'rehype-raw';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import type { AssetObject } from '@handoff/types';
import { getClientConfig } from '@handoff/config';
import Icon from '../../../components/Icon';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import CustomNav from '../../../components/SideNav/Custom';
import { MarkdownComponents } from '../../../components/Markdown/MarkdownComponents';
import { AssetDocumentationProps, fetchDocPageMarkdown, getTokens } from '../../../components/util';

const DisplayIcon: React.FC<{ icon: AssetObject }> = ({ icon }) => {
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
      <Link href={`/assets/icons/${icon.icon}`}>
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
      ...fetchDocPageMarkdown('docs/assets/', 'icons', `/assets`).props,
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
    <div className="c-page">
      <Head>
        <title>{metadata.metaTitle}</title>
        <meta name="description" content={metadata.metaDescription} />
      </Head>
      <Header menu={menu} config={config} />
      {current.subSections.length > 0 && <CustomNav menu={current} />}
      <section className="c-content">
        <div className="o-container">
          <div className="c-hero">
            <div className="o-row">
              <div className="o-col-10@md">
                <div>
                  <h1>{metadata.title}</h1>
                  <p>{metadata.description}</p>
                  <p>
                    <a href={config?.assets_zip_links?.icons ?? '/icons.zip'}>Download All Icons</a>
                  </p>
                </div>
              </div>
            </div>
            {metadata.image && <Icon name={metadata.image} className="c-hero__img c-hero__image--small" />}
          </div>
          <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
            {content}
          </ReactMarkdown>
          <div className="c-form-element c-form-element--fullwidth c-form-element--big">
            <div className="c-form-element__field">
              <div className="c-form-element__icon">
                <Icon name="search" className="o-icon" />
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
                    <Icon name="search-laptop"  className="o-icon" />
                    <h4>No icons found.</h4>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer config={config} />
    </div>
  );
};
export default IconsPage;
