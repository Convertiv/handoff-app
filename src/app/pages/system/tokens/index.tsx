import { getClientConfig } from '@handoff/config';
import type { GetStaticProps } from 'next';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { APIComponentList } from '../../../components/Component/ComponentLists';
import Layout from '../../../components/Layout/Main';
import { MarkdownComponents } from '../../../components/Markdown/MarkdownComponents';
import HeadersType from '../../../components/Typography/Headers';
import { DocumentationProps, fetchComponents, fetchDocPageMarkdown, fetchDocPageMetadataAndContent, Metadata } from '../../../components/util';

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
  // Fetch components from api

  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      <div className="flex flex-col gap-2 pb-7">
        <HeadersType.H1>{metadata.title}</HeadersType.H1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{metadata.description}</p>
      </div>
      <div className="mt-10">
        <ReactMarkdown className="prose" components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
          {content}
        </ReactMarkdown>

        <APIComponentList />
      </div>
    </Layout>
  );
};

export default ComponentsPage;
