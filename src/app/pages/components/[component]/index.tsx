import { getClientConfig } from '@handoff/config';
import { ComponentDisplay, ComponentPreview } from '../../../components/ComponentPreview';
import { Hero } from '../../../components/Hero';
import { fetchComponents, getCurrentSection, getPreview, IParams, staticBuildMenu } from '../../../components/util';
import Head from 'next/head';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { startCase } from 'lodash';
import CustomNav from '../../../components/SideNav/Custom';
import { PreviewContextProvider } from '../../../components/context/PreviewContext';

/**
 * Render all index pages
 * @returns
 */
export async function getStaticPaths() {
  return {
    paths: fetchComponents().map((exportable) => ({ params: { component: exportable.id } })),
    fallback: false, // can also be true or 'blocking'
  };
}

export const getStaticProps = async (context) => {
  const { component } = context.params as IParams;
  console.log('component', component);
  // get previews for components on this page
  const previews = getPreview();
  const menu = staticBuildMenu();
  const config = getClientConfig();
  const metadata = await fetchComponents().filter((c) => c.id === component)[0];
  console.log('metadata', metadata);
  return {
    props: {
      id: component,
      previews,
      menu,
      config,
      current: getCurrentSection(menu, '/components') ?? [],
      title: metadata.name,
      description: metadata.description,
      image: 'hero-brand-assets',
    },
  };
};

const GenericComponentPage = ({ title, description, menu, metadata, current, id, config, previews, image }) => {
  return (
    <div className="c-page">
      <Head>
        <title>Title</title>
        <meta name="description" content="description" />
      </Head>
      <Header menu={menu} config={config} />
      {current.subSections && current.subSections.length > 0 && <CustomNav menu={current} />}
      <section className={`c-content c-content__wide` }>
        <div className="o-container-fluid o-container__markdown">
          <Hero title={title} image={image}>
            <p>{description}</p>
          </Hero>
          <PreviewContextProvider defaultMetadata={metadata} defaultMenu={menu} defaultPreview={previews} defaultConfig={config}>
            <ComponentPreview title="Form" id={id}>
              <p>Define a simple contact form</p>
            </ComponentPreview>
          </PreviewContextProvider>
        </div>
      </section>
      <Footer config={config} />
    </div>
  );
};
export default GenericComponentPage;
