import * as React from 'react';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import { startCase } from 'lodash';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { getClientConfig } from '@handoff/config';
import { DocumentationProps, fetchDocPageMarkdown, fetchDocPageMetadataAndContent, fetchComponents, Metadata } from '../../components/util';
import { MarkdownComponents } from '../../components/Markdown/MarkdownComponents';
import { ComponentsPageCard } from '../../components/ComponentLists';
import HeaderH1 from '../../components/Typography/Headers';
import Layout from '../../components/Layout/Main';

type ComponentPageDocumentationProps = DocumentationProps & {
  components: { [id: string]: Metadata };
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
  // Read current slug
  const components = fetchComponents().map((c) => c.id);
  const config = getClientConfig();
  return {
    ...{
      props: {
        config,
        ...fetchDocPageMarkdown('docs/', 'system', `/system`).props,
        components: components.reduce(
          (acc, component) => ({
            ...acc,
            ...{
              [component]: fetchDocPageMetadataAndContent('docs/components/', component).metadata,
            },
          }),
          {}
        ),
      } as ComponentPageDocumentationProps,
    },
  };
};
/**
 * Define the components page
 * @param param0
 * @returns
 */
const ComponentsPage = ({ content, menu, metadata, current, components, config }: ComponentPageDocumentationProps) => {
  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      <div className="flex flex-col gap-2 pb-7">
        <HeaderH1>{metadata.title}</HeaderH1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{metadata.description}</p>
      </div>
      <div className="mt-10">
        <>
          {Object.keys(components).map((componentId) => {
            const component = components[componentId];

            return (
              <ComponentsPageCard
                key={`component-${componentId}`}
                component={componentId}
                title={component.title ?? startCase(componentId)}
                description={component.description}
                icon={component.image}
              />
            );
          })}
        </>

        <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
          {content}
        </ReactMarkdown>
      </div>
    </Layout>
  );
};

export default ComponentsPage;
