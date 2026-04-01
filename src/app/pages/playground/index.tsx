import type { GetStaticProps } from 'next';
import Layout from '../../components/Layout/Main';
import { TooltipProvider } from '../../components/ui/tooltip';
import { PlaygroundProvider } from '../../components/Playground/PlaygroundContext';
import PlaygroundBuilder from '../../components/Playground/PlaygroundBuilder';
import { DocumentationProps, fetchDocPageMarkdown, getClientRuntimeConfig } from '../../components/util';

export const getStaticProps: GetStaticProps = async () => {
  const config = getClientRuntimeConfig();
  return {
    props: {
      config,
      ...fetchDocPageMarkdown('docs/', 'playground', `/playground`).props,
    } as DocumentationProps,
  };
};

const PlaygroundPage = ({ menu, metadata, current, config }: DocumentationProps) => {
  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata} fullWidthHero>
      <TooltipProvider>
        <PlaygroundProvider>
          <PlaygroundBuilder />
        </PlaygroundProvider>
      </TooltipProvider>
    </Layout>
  );
};

export default PlaygroundPage;
