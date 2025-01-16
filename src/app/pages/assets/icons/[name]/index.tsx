import * as React from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import HtmlReactParser from 'html-react-parser';
import { AssetObject } from '@handoff/types';
import { getClientConfig } from '@handoff/config';
import Icon from '../../../../components/Icon';
import Header from '../../../../components/old/Header';
import CustomNav from '../../../../components/SideNav/Custom';
import Footer from '../../../../components/Footer';
import { AssetDocumentationProps, fetchDocPageMarkdown, getTokens } from '../../../../components/util';

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
      ...fetchDocPageMarkdown('docs/assets/', 'icons', `/assets`).props,
      config: getClientConfig(),
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
    <div className="c-page">
      <Head>
        {!icon ? (
          <title>{`Icon Not Found | ${config?.app?.client} Design System`}</title>
        ) : (
          <title>{`${icon.name} Icon | ${config?.app?.client} Design System`}</title>
        )}
      </Head>
      <Header menu={menu} config={config} />
      {current?.subSections?.length > 0 && <CustomNav menu={current} />}
      <section className="c-content">
        {!icon ? (
          <div>404 Icon Not Found</div>
        ) : (
          <div className="o-container">
            <div className="c-hero">
              <div>
                <h1 className="c-title--extra-large c-text-monospace">{icon.name}</h1>
              </div>
              <div className="c-hero__meta">
                <small>{icon.size}b</small>
                <small>&bull;</small>
                <small>
                  <a href="#">
                    <Icon name="share" className="u-mr-1 o-icon" /> Share Asset
                  </a>
                </small>
                <small>&bull;</small>
                <small>
                  <a href="#" onClick={copySvg}>
                    <Icon name="code" className="u-mr-1 o-icon" /> Copy SVG
                  </a>
                </small>
                <small>&bull;</small>
                <small>
                  <a href={'data:text/plain;charset=utf-8,' + encodeURIComponent(icon.data)} download={icon.name}>
                    <Icon name="download" className="u-mr-1 o-icon" /> Download SVG
                  </a>
                </small>
              </div>
            </div>
            <div className="o-row">
              <div className="o-col-7">
                <div className="c-icon-preview c-icon-preview--big">
                  <DisplayIcon icon={icon} />
                </div>
              </div>
              <div className="o-col-5">
                <div className="c-icon-preview c-icon-preview--on-light">
                  <DisplayIcon icon={icon} />
                </div>
                <div className="c-icon-preview c-icon-preview--on-dark">
                  <DisplayIcon icon={icon} />
                </div>
              </div>
            </div>

            <h5 className="u-mt-6 u-mb-3">Live Preview</h5>
            <div className="o-row">
              <div className="o-col-4@md">
                <div className="c-icon-live-preview">
                  <div className="c-icon-live-preview__menu">
                    <ul>
                      <li>
                        <Icon name="plus-circle" className="o-icon" /> <span>Add item</span>
                      </li>
                      <li className="c-icon-live-preview__menu--active">
                        <DisplayIcon icon={icon} />
                        <span>Menu label</span>
                      </li>
                      <li>
                        <Icon name="search" className="o-icon" /> <span>Search items</span>
                        <small>6</small>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="o-col-4@md">
                <div className="c-icon-live-preview">
                  <div className="c-icon-live-preview__button">
                    <a href="#" className="c-button c-button--full c-button--primary">
                      <DisplayIcon icon={icon} /> Button Label
                    </a>
                    <a href="#" className="c-button c-button--full c-button--transparent">
                      <DisplayIcon icon={icon} /> Button Label
                    </a>
                  </div>
                </div>
              </div>
              <div className="o-col-4@md">
                <div className="c-icon-live-preview">
                  <div className="c-icon-live-preview__nav">
                    <span>
                      <a href="#">
                        <Icon name="plus-circle" className="o-icon" />
                      </a>
                    </span>
                    <span>
                      <a href="#" className="active">
                        <DisplayIcon icon={icon} />
                      </a>
                    </span>
                    <span>
                      <a href="#">
                        <Icon name="search" className="o-icon" />
                      </a>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
      <Footer config={config} />
    </div>
  );
}
