import { ComponentDocumentationProps } from './util';
import * as React from 'react';
import Head from 'next/head';
import startCase from 'lodash/startCase';
import Header from './Header';
import CustomNav from './SideNav/Custom';
import Footer from './Footer';

interface MarkdownLayoutProps extends ComponentDocumentationProps {
  children: React.ReactNode;
}

const MdxLayout = ({
  menu,
  metadata,
  current,
  id,
  config,
  children,
}: MarkdownLayoutProps) => {

  if(!menu) menu = [];
  menu = MarkdownMenuBuilder();
  return (
    <div className="c-page">
      <Head>
        <title>{metadata.metaTitle ?? startCase(id)}</title>
        <meta name="description" content={metadata.metaDescription} />
      </Head>
      <Header menu={menu} config={config} />
      {current.subSections.length > 0 && <CustomNav menu={current} />}
      <section className="c-content">
        <div className="o-container-fluid">
          {children}
        </div>
      </section>
      <Footer config={config} />
    </div>
  );
};

export const MarkdownMenuBuilder = () => {
  // TODO: Handle static mdx menu builder
  return [];
};

// export const MarkdownComponentLayout = 


export default MdxLayout;