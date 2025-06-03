import { getClientConfig } from '@handoff/config';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import ComponentSearch from '../../../components/ComponentSearch';
import Footer from '../../../components/Footer';
import { MarkdownComponents } from '../../../components/Markdown/MarkdownComponents';
import Header from '../../../components/old/Header';
import {
    DocumentationProps,
    fetchComponents,
    fetchDocPageMarkdown,
    fetchDocPageMetadataAndContent,
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
  const components = fetchComponents().map((c) => c.id);
  const config = getClientConfig();
  return {
    ...{
      props: {
        config,
        ...fetchDocPageMarkdown('docs/', 'components', `/components`).props,
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
const ComponentsListPage = ({ content, menu, metadata, current, components, config }: ComponentPageDocumentationProps) => {
  return (
    <div className="c-page">
      <Head>
        <title>{metadata.metaTitle}</title>
        <meta name="description" content={metadata.metaDescription} />
      </Head>
      <Header menu={menu} config={config} />
      <section className="c-content">
        <div className="o-container-fluid">
          <div className="c-hero c-hero--boxed c-hero--bg-blue">
            <div>
              <h1 className="c-title--extra-large">{metadata.title}</h1>
              <p>{metadata.description}</p>
            </div>
          </div>

          <div className="o-row">
            <div className="o-col-12@md">
              <ComponentSearch />
            </div>
          </div>
          <ReactMarkdown className="prose" components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
            {content}
          </ReactMarkdown>
        </div>
      </section>
      <Footer config={config} />
    </div>
  );
};

export default ComponentsListPage;
