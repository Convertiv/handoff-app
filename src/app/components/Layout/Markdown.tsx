import { PreviewJson } from '@handoff/types';
import * as React from 'react';
import { PreviewContextProvider } from '../context/PreviewContext';
import HeadersType from '../Typography/Headers';
import { ComponentDocumentationProps } from '../util';
import Layout from './Main';

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
        <HeadersType.H1>{metadata.title}</HeadersType.H1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{metadata.description}</p>
      </div>
      <div>
        <PreviewContextProvider defaultMetadata={metadata} defaultMenu={menu} defaultPreview={allPreviews} defaultConfig={config}>
          {children}
        </PreviewContextProvider>
      </div>
    </Layout>
  );
};

export default MdxLayout;
//      <AnchorNav />
