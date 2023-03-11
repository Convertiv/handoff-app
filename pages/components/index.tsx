import * as React from 'react';
import type { GetStaticProps, NextPage } from 'next';
import Link from 'next/link';
import Icon from 'components/Icon';
import Head from 'next/head';
import { DocumentationProps, fetchDocPageMarkdown, fetchDocPageMetadataAndContent, Metadata } from 'components/util';
import Header from 'components/Header';
import ReactMarkdown from 'react-markdown';
import CustomNav from 'components/SideNav/Custom';
import { MarkdownComponents } from 'components/util/MarkdownComponents';
import rehypeRaw from 'rehype-raw';

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
}

enum UnavailableComponentPageComponents {
  PAGINATION = 'pagination',
}

type ComponentPageComponents = AvailableComponentPageComponents | UnavailableComponentPageComponents;

type ComponentPageDocumentationProps = DocumentationProps & {
  components: { [component in ComponentPageComponents]: Metadata };
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
  const result = fetchDocPageMarkdown('docs/', 'components', `/components`);
  const componentsToFetch = [
    ...(Object.values(AvailableComponentPageComponents) as string[]),
    ...(Object.values(UnavailableComponentPageComponents) as string[]),
  ];

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
        },
      } as ComponentPageDocumentationProps,
    },
  };
};

const ComponentsPage = ({ content, menu, metadata, current, components }: ComponentPageDocumentationProps) => {
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
                  {(Object.keys(AvailableComponentPageComponents) as Array<keyof typeof AvailableComponentPageComponents>).map(
                    (component) => (
                      <ComponentsPageCard
                        key={`component-${component}`}
                        component={AvailableComponentPageComponents[component]}
                        title={components[AvailableComponentPageComponents[component]].title}
                        descripton={components[AvailableComponentPageComponents[component]].description}
                        icon={components[AvailableComponentPageComponents[component]].image}
                      />
                    )
                  )}
                  {/* Unavailable components */}
                  {(Object.keys(UnavailableComponentPageComponents) as Array<keyof typeof UnavailableComponentPageComponents>).map(
                    (component) => (
                      <ComponentsPageCard
                        key={`component-${component}`}
                        component={UnavailableComponentPageComponents[component]}
                        title={components[UnavailableComponentPageComponents[component]].title}
                        descripton={components[UnavailableComponentPageComponents[component]].description}
                        icon={components[UnavailableComponentPageComponents[component]].image}
                        available={false}
                      />
                    )
                  )}
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
  descripton,
  icon,
  available = true,
}: {
  component: string;
  title: string;
  descripton: string;
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
