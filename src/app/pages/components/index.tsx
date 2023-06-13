import * as React from 'react';
import type { GetStaticProps } from 'next';
import Icon from '../../components/Icon';
import Head from 'next/head';
import {
  DocumentationProps,
  fetchDocPageMarkdown,
  fetchDocPageMetadataAndContent,
  fetchExportables,
  Metadata,
} from '../../components/util';
import Header from '../../components/Header';
import ReactMarkdown from 'react-markdown';
import CustomNav from '../../components/SideNav/Custom';
import { MarkdownComponents } from '../../components/Markdown/MarkdownComponents';
import rehypeRaw from 'rehype-raw';
import Link from 'next/link';
import { getConfig } from '../../../config';

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
  const components = fetchExportables().map(exportable => exportable.id);
  const config = getConfig();
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

const ComponentsPage = ({ content, menu, metadata, current, components, config }: ComponentPageDocumentationProps) => {
  return (
    <div className="c-page">
      <Head>
        <title>{metadata.metaTitle}</title>
        <meta name="description" content={metadata.metaDescription} />
      </Head>
      <Header menu={menu} config={config}/>
      {current.subSections.length > 0 && <CustomNav menu={current} />}
      <section className="c-content">
        <div className="o-container-fluid">
          <div className="c-hero c-hero--boxed c-hero--bg-blue">
            <div>
              <h1 className="c-title--extra-large">{metadata.title}</h1>
              <p>{metadata.description}</p>
            </div>
            {metadata.image && <Icon name={metadata.image} className="c-hero__img" />}
          </div>

          <div className="o-row">
            <div className="o-col-12@md">
              <div className="o-stack-2@md o-stack-3@lg u-mb-n-4">
                <>
                  {Object.keys(components).map((componentId) => {
                    const component = components[componentId];

                    return (
                      <ComponentsPageCard
                        key={`component-${componentId}`}
                        component={componentId}
                        title={component.title ?? componentId}
                        description={component.description}
                        icon={component.image}
                      />
                    )
                  })}
                </>
              </div>
            </div>
          </div>
          <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
            {content}
          </ReactMarkdown>
        </div>
      </section>
    </div>
  );
};

const ComponentsPageCard = ({
  component,
  title,
  description: descripton,
  icon,
  available = true,
}: {
  component: string;
  title: string;
  description: string;
  icon: string;
  available?: boolean;
}) => (
  <div key={`component-${component}`}>
    <Link href={available ? `/components/${component}` : '#'}>
      <div className={`c-component-card ${!available && 'c-component-card--soon'}`}>
        <div className="c-component-card__img">
          <Icon name={icon} />
        </div>
        <h6>{title}</h6>
        <p>{descripton}</p>
      </div>
    </Link>
  </div>
);

export default ComponentsPage;
