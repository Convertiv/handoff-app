import { Button } from '@/components/ui/button';
import { getClientConfig } from '@handoff/config';
import { ArrowRight, Code2 } from 'lucide-react';
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
    <Layout config={config} menu={menu} current={current} metadata={metadata} fullWidthHero={true}>
      <div className="w-full bg-gradient-to-r py-20 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-8">
          <HeadersType.H1 className="max-w-4xl text-5xl font-light">{config?.app?.client} Design System</HeadersType.H1>
          <p className="mt-8 max-w-3xl text-2xl font-light leading-normal text-gray-600 dark:text-gray-300">
            A complete design system with components, guidelines, and resources to help teams build consistent, accessible, and beautiful
            digital experiences.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-8 py-16">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <h3 className="mb-3 text-2xl font-medium">Foundations</h3>
            <p className="mb-8 leading-relaxed">Official SS&C color palette used for all digital products.</p>
          </div>
          <a
            href=""
            className="group rounded-lg border border-gray-200 p-7 transition-colors hover:border-gray-300 hover:bg-gray-50/50 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-900"
          >
            <div className="flex flex-col items-start gap-2">
              <div className="h-20 w-full overflow-hidden">
                <div className="grid h-full scale-75 grid-cols-4 gap-3">
                  <div className="relative block rounded bg-[#0077C8]" title="#0077C8">
                    <div className="absolute bottom-0 left-0 flex flex-col gap-0.5 px-4 py-4">
                      <p className="text-[8px] font-medium text-white">Blue 900</p>
                      <p className="font-mono text-[8px] text-white">#003152</p>
                    </div>
                  </div>
                  <div className="block rounded bg-[#CCE4F4]" />
                  <div className="block rounded bg-[#99C9E9]" />
                  <div className="block rounded bg-[#66ADDE]" />
                  <div className="block rounded bg-[#3392D3]" />
                  <div className="block rounded bg-[#0077C8]" />
                  <div className="block rounded bg-[#005F9E]" />
                </div>
              </div>
              <h3 className="text-base font-medium">Colors</h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                Official SS&C color palette used for all digital products.
              </p>
              <Button variant="link" className="px-0 text-sm font-medium text-gray-900 hover:no-underline dark:text-gray-100">
                View Colors
                <ArrowRight className="inline-block transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </a>
          <a
            href=""
            className="rounded-lg border border-gray-200 p-7 transition-colors hover:border-gray-300 hover:bg-gray-50/50 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-900"
          >
            <div className="flex flex-col gap-2">
              <Code2 className="h-5 w-5 text-gray-500 dark:text-gray-400 " strokeWidth={1.5} />
              <h3 className="text-base font-medium">Javascript</h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                Handoff strives to make our sites accessible to all users. This section provides guidelines and tools to help you build
                accessible sites.
              </p>
            </div>
          </a>
        </div>
        <ReactMarkdown className="prose mt-16" components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
          {content}
        </ReactMarkdown>
      </div>
    </Layout>
  );
};
export default Home;
