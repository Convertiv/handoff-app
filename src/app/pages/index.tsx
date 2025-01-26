import { getClientConfig } from '@handoff/config';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Layout from '../components/Layout/Main';
import { MarkdownComponents } from '../components/Markdown/MarkdownComponents';
import HeadersType from '../components/Typography/Headers';
import { ChangelogDocumentationProps, fetchDocPageMarkdown, getChangelog } from '../components/util';

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
      <HeadersType.H1>
        <strong>{config?.app?.client} Design System</strong> for building better user experiences.
      </HeadersType.H1>
      <ReactMarkdown className="prose" components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </Layout>
  );
};
export default Home;
