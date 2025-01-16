import { ComponentDocumentationProps } from '../util';
import * as React from 'react';
import Head from 'next/head';
import startCase from 'lodash/startCase';
import Header from '../old/Header';
import CustomNav from '../SideNav/Custom';
import Footer from '../Footer';
import { PreviewContextProvider } from '../context/PreviewContext';
import { PreviewJson } from '@handoff/types';
import Layout from './Main';
import { AnchorNav } from '../Navigation/AnchorNavNew';
import HeaderH1 from '../Typography/Headers';

interface MarkdownLayoutProps extends ComponentDocumentationProps {
  children: React.ReactNode;
  wide?: boolean;
  allPreviews?: PreviewJson;
}

const MdxLayout = ({ menu, metadata, current, id, config, children, wide, allPreviews }: MarkdownLayoutProps) => {
  if (!menu) menu = [];
  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      <div className="flex flex-col gap-2 pb-7">
        <HeaderH1>{metadata.title}</HeaderH1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{metadata.description}</p>
      </div>
      <div className="lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_280px]">
        <div>
          <PreviewContextProvider defaultMetadata={metadata} defaultMenu={menu} defaultPreview={allPreviews} defaultConfig={config}>
            {children}faw
          </PreviewContextProvider>
        </div>
      </div>
      <AnchorNav />
    </Layout>
  );
};

export default MdxLayout;
