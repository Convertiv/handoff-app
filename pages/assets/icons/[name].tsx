import * as React from 'react';
import type { GetStaticProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import HtmlReactParser from 'html-react-parser';
import * as fs from 'fs-extra';
import { AssetObject } from 'figma-exporter/src/types';
import { getConfig } from 'config';
import Icon from 'components/Icon';

import Head from 'next/head';
import Header from 'components/Header';
import { DocumentationProps, fetchDocPageMarkdown, SectionLink, staticBuildMenu } from 'components/util';
import path from 'path';
import CustomNav from 'components/SideNav/Custom';

const config = getConfig();

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
  const paths = config.assets.icons.map((icon) => ({
    params: {
      name: icon.name,
    },
  }));
  return {
    paths,
    fallback: true,
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
export const getStaticProps: GetStaticProps = async (context) => {
  // Read current slug
  return fetchDocPageMarkdown('docs/assets/', 'icons', `/assets`);
};

const SingleIcon = ({ content, menu, metadata, current }: DocumentationProps) => {
  const router = useRouter();
  let { name } = router.query;
  const icon = config.assets.icons.find((icon) => icon.icon === name);
  const copySvg = React.useCallback<React.MouseEventHandler>(
    (event) => {
      event.preventDefault();
      if (icon) {
        navigator.clipboard.writeText(icon.data);
      }
    },
    [icon]
  );
  if(!menu){
    menu = [];
  }
  return (
    <div className="c-page">
      <Head>
        {!icon ? (
          <title>{`Icon Not Found | ${config.client} Design System`}</title>
        ) : (
          <title>{`${icon.name} Icon | ${config.client} Design System`}</title>
        )}
      </Head>
      <Header menu={menu} />
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
                    <Icon name="share" className="u-mr-1" /> Share Asset
                  </a>
                </small>
                <small>&bull;</small>
                <small>
                  <a href="#" onClick={copySvg}>
                    <Icon name="code" className="u-mr-1" /> Copy SVG
                  </a>
                </small>
                <small>&bull;</small>
                <small>
                  <a href={'data:text/plain;charset=utf-8,' + encodeURIComponent(icon.data)} download={icon.name}>
                    <Icon name="download" className="u-mr-1" /> Download SVG
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
                        <Icon name="plus-circle" /> <span>Add item</span>
                      </li>
                      <li className="c-icon-live-preview__menu--active">
                        <DisplayIcon icon={icon} />
                        <span>Menu label</span>
                      </li>
                      <li>
                        <Icon name="search" /> <span>Search items</span>
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
                        <Icon name="plus-circle" />
                      </a>
                    </span>
                    <span>
                      <a href="#" className="active">
                        <DisplayIcon icon={icon} />
                      </a>
                    </span>
                    <span>
                      <a href="#">
                        <Icon name="search" />
                      </a>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
export default SingleIcon;
