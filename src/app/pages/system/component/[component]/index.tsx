import { getClientConfig } from '@handoff/config';
import { ComponentDisplay, ComponentPreview } from '../../../../components/Component/Preview';
import { Hero } from '../../../../components/Hero';
import { fetchComponents, getCurrentSection, getPreview, IParams, staticBuildMenu } from '../../../../components/util';
import Head from 'next/head';
import Header from '../../../../components/old/Header';
import Footer from '../../../../components/Footer';
import { startCase } from 'lodash';
import CustomNav from '../../../../components/SideNav/Custom';
import { PreviewContextProvider } from '../../../../components/context/PreviewContext';
import HeaderH1 from '@/components/Typography/Headers';
import Layout from '@/components/Layout/Main';

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
  // get previews for components on this page
  const previews = getPreview();
  const menu = staticBuildMenu();
  const config = getClientConfig();
  const metadata = await fetchComponents().filter((c) => c.id === component)[0];
  return {
    props: {
      id: component,
      previews,
      menu,
      config,
      current: getCurrentSection(menu, '/system') ?? [],
      metadata: {
        ...metadata,
        title: metadata.name,
        description: metadata.description,
        image: 'hero-brand-assets',
      },
    },
  };
};

const GenericComponentPage = ({ menu, metadata, current, id, config, previews }) => {
  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      <div className="flex flex-col gap-2 pb-7">
        <HeaderH1>{metadata.title}</HeaderH1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{metadata.description}</p>
      </div>
      <div className="lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_280px]">
        <div>
          <PreviewContextProvider defaultMetadata={metadata} defaultMenu={menu} defaultPreview={previews} defaultConfig={config}>
            <ComponentPreview title="Form" id={id}>
              <p>Define a simple contact form</p>
            </ComponentPreview>
          </PreviewContextProvider>
        </div>
      </div>
    </Layout>
  );
};
export default GenericComponentPage;
