import { PreviewObject } from '@handoff/types';
import type { GetStaticProps } from 'next';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { APIComponentList } from '../../../components/Component/ComponentLists';
import Layout from '../../../components/Layout/Main';
import { MarkdownComponents } from '../../../components/Markdown/MarkdownComponents';
import HeadersType from '../../../components/Typography/Headers';
import {
  DocumentationProps,
  fetchComponents,
  fetchDocPageMarkdown,
  fetchDocPageMetadataAndContent,
  getClientRuntimeConfig,
  Metadata,
} from '../../../components/util';

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
  const components = fetchComponents()?.map((c) => c.id);
  const config = getClientRuntimeConfig();
  return {
    ...{
      props: {
        config,
        ...fetchDocPageMarkdown('docs/', 'system', `/system`).props,
        components: components
          ? components.reduce(
              (acc, component) => ({
                ...acc,
                ...{
                  [component]: fetchDocPageMetadataAndContent('docs/components/', component).metadata,
                },
              }),
              {}
            )
          : null,
      } as ComponentPageDocumentationProps,
    },
  };
};
/**
 * Define the components page
 * @param param0
 * @returns
 */
const ComponentsPage = ({ content, menu, metadata, current, config }: ComponentPageDocumentationProps) => {
  // Fetch components from api
  const [components, setComponents] = useState<PreviewObject[]>(undefined);
  const fetchComponents = async () => {
    let data = await fetch(`/api/components.json`).then((res) => res.json());
    setComponents(data as PreviewObject[]);
  };
  useEffect(() => {
    fetchComponents();
  }, []);
  if (!components) return <p>Loading...</p>;
  const apiUrl = (window.location.origin && window.location.origin) + `/api/components.json`;
  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      <div className="flex flex-col gap-2 pb-7">
        <HeadersType.H1>{metadata.title}</HeadersType.H1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{metadata.description}</p>
      </div>
      <div className="mt-10">
        <div className="prose">
          <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
            {content}
          </ReactMarkdown>
        </div>
        <APIComponentList components={components} />
      </div>
    </Layout>
  );
};

export default ComponentsPage;
