import * as React from 'react';
import type { GetStaticProps, NextPage } from 'next';
import Link from 'next/link';
import Icon from 'components/Icon';
import Head from 'next/head';
import {
  componentExists,
  DocumentationProps,
  fetchDocPageMarkdown,
  fetchDocPageMetadataAndContent,
  Metadata,
  pluralizeComponent,
} from 'components/util';
import Header from 'components/Header';
import ReactMarkdown from 'react-markdown';
import CustomNav from 'components/SideNav/Custom';
import { MarkdownComponents } from 'components/Markdown/MarkdownComponents';
import rehypeRaw from 'rehype-raw';
import { getConfig } from 'config';

enum AvailableComponentPageComponents {
  ALERT = 'alert',
  BUTTON = 'button',
  MODAL = 'modal',
  TOOLTIP = 'tooltip',
  CHECKBOX = 'checkbox',
  INPUT = 'input',
  RADIO = 'radio',
  SELECT = 'select',
  SWITCH = 'switch',
  PAGINATION = 'pagination',
}

type ComponentPageComponents = AvailableComponentPageComponents;

type ComponentPageDocumentationProps = DocumentationProps & {
  components: { [component in ComponentPageComponents]: Metadata };
  available: ComponentPageComponents[];
  unavailable: ComponentPageComponents[];
};

const config = getConfig();

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
  const result = fetchDocPageMarkdown('docs/', 'components', `/components`);
  const componentsToFetch = [...(Object.values(AvailableComponentPageComponents) as string[])];

  const available: ComponentPageComponents[] = Object.values(AvailableComponentPageComponents).filter((comp: string) =>
    componentExists(pluralizeComponent(comp), config)
  );
  const unavailable: ComponentPageComponents[] = Object.values(AvailableComponentPageComponents).filter(
    (comp: string) => !componentExists(pluralizeComponent(comp), config)
  );

  return {
    ...result,
    ...{
      props: {
        ...result.props,
        ...{
          components: componentsToFetch.reduce(
            (acc, component) => ({
              ...acc,
              ...{
                [component]: fetchDocPageMetadataAndContent('docs/components/', component).metadata,
              },
            }),
            {}
          ),
          available,
          unavailable,
        },
      } as ComponentPageDocumentationProps,
    },
  };
};

const ComponentsPage = ({ content, menu, metadata, current, components, available, unavailable }: ComponentPageDocumentationProps) => {
  available.map((component) => {
    console.log(component);
    console.log(components[component]);
  });
  return (
    <div className="c-page">
      <Head>
        <title>{metadata.metaTitle}</title>
        <meta name="description" content={metadata.metaDescription} />
      </Head>
      <Header menu={menu} />
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
                  {/* Available components */}
                  {available.map((component) => (
                    <ComponentsPageCard
                      key={`component-${component}`}
                      component={component}
                      title={components[component].title}
                      description={components[component].description}
                      icon={components[component].image}
                    />
                  ))}
                </>
              </div>
            </div>
          </div>
          <hr />
          <div className="o-row">
            <div className="o-col-12@md">
              <div className="o-stack-2@md o-stack-3@lg u-mb-n-4">
                <>
                  {/* Unavailable components */}
                  {unavailable.map((component) => (
                    <ComponentsPageCard
                      key={`component-${component}`}
                      component={component}
                      title={components[component].title}
                      description={components[component].description}
                      icon={components[component].image}
                      available={false}
                    />
                  ))}
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
