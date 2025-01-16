import Layout from '@/components/Layout/Main';
import { ChangelogDocumentationProps, fetchDocPageMarkdown, getChangelog } from '@/components/util';
import { GetStaticProps } from 'next';
import { getClientConfig } from '@handoff/config';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import ReactMarkdown from 'react-markdown';
import { MarkdownComponents } from '@/components/Markdown/MarkdownComponents';
import rehypeRaw from 'rehype-raw';
import HeaderH1 from '@/components/Typography/Headers';

/**
 * This statically renders the menu mixing markdown file links with the
 * normal menu
 *
 * This is all done statically at build time
 * @param context GetStaticProps
 * @returns
 */
export const getStaticProps: GetStaticProps = async (context) => {
  return {
    props: {
      ...fetchDocPageMarkdown('docs/', 'index', `/`).props,
      config: getClientConfig(),
      changelog: getChangelog(),
    },
  };
};

const Home = ({ content, menu, metadata, config, changelog, current }: ChangelogDocumentationProps) => {
  const router = useRouter();

  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      <HeaderH1>
        <strong>{config?.app?.client} Design System</strong> for building better user experiences.
      </HeaderH1>
      <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </Layout>
  );
};
export default Home;
