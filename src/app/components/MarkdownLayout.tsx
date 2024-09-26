import { ComponentDocumentationProps } from './util';
import * as React from 'react';
import Head from 'next/head';
import startCase from 'lodash/startCase';
import Header from './Header';
import CustomNav from './SideNav/Custom';
import Footer from './Footer';
import { MdxContextProvider } from './context/MdxContext';
import { PreviewJson } from '@handoff/types';

interface MarkdownLayoutProps extends ComponentDocumentationProps {
  children: React.ReactNode;
  wide?: boolean;
  allPreviews?: PreviewJson;
}

const MdxLayout = ({ menu, metadata, current, id, config, children, wide, allPreviews }: MarkdownLayoutProps) => {
  if (!menu) menu = [];
  return (
    <div className="c-page">
      <Head>
        <title>{metadata.metaTitle ?? startCase(id)}</title>
        <meta name="description" content={metadata.metaDescription} />
      </Head>
      <Header menu={menu} config={config} />
      {current.subSections && current.subSections.length > 0 && <CustomNav menu={current} />}
      <section className={`c-content${wide ? ' c-content__wide' : ''}`}>
        <div className="o-container-fluid o-container__markdown">
          {' '}
          <MdxContextProvider defaultMetadata={metadata} defaultMenu={menu} defaultPreview={allPreviews} defaultConfig={config}>
            {children}
          </MdxContextProvider>
        </div>
      </section>
      <Footer config={config} />
    </div>
  );
};

export default MdxLayout;
