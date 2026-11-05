'use client';
import { startCase } from 'lodash';
import { useRouter } from 'next/router';
import { CustomPreviewEditor } from '../../../../../components/CustomPreview/CustomPreviewEditor';
import Layout from '../../../../../components/Layout/Main';
import { fetchComponents, getClientRuntimeConfig, getNavProps, isRegistryRuntime } from '../../../../../components/util';

export async function getStaticPaths() {
  return { paths: [], fallback: isRegistryRuntime() ? ('blocking' as const) : false };
}

export const getStaticProps = async (context) => {
  if (!isRegistryRuntime()) return { notFound: true };
  const { component, preview } = context.params as { component: string; preview: string };
  const componentData = (await fetchComponents()).find((c) => c.id === component);
  if (!componentData) return { notFound: true };

  const title = componentData.title || startCase(component);
  return {
    props: {
      ...(await getNavProps('/system')),
      config: getClientRuntimeConfig(),
      componentId: component,
      componentTitle: title,
      customPreviewId: preview === 'new' ? null : preview,
      metadata: {
        title: preview === 'new' ? `New custom preview · ${title}` : `Custom preview · ${title}`,
        description: componentData.description ?? '',
        metaTitle: '',
        metaDescription: componentData.description ?? '',
      },
    },
  };
};

const CustomPreviewPage = ({ menu, current, config, metadata, componentId, componentTitle, customPreviewId }) => {
  const { query } = useRouter();
  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      {/* Keyed so a new preview, once saved to its own route, gets a fresh editor. */}
      <CustomPreviewEditor
        key={`${customPreviewId ?? 'new'}-${typeof query.from === 'string' ? query.from : ''}`}
        componentId={componentId}
        componentTitle={componentTitle}
        customPreviewId={customPreviewId}
      />
    </Layout>
  );
};

export default CustomPreviewPage;
