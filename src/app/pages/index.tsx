import { ArrowRight, Component, Hexagon, Layers, Shapes } from 'lucide-react';
import { GetStaticProps } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Footer from '../components/Footer';
import Layout from '../components/Layout/Main';
import { MarkdownComponents } from '../components/Markdown/MarkdownComponents';
import HeadersType from '../components/Typography/Headers';
import { Button } from '../components/ui/button';
import { ChangelogDocumentationProps, fetchDocPageMarkdown, getChangelog, getClientRuntimeConfig } from '../components/util';

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
      config: getClientRuntimeConfig(),
      changelog: getChangelog(),
    },
  };
};

const Home = ({ content, menu, metadata, config, changelog, current }: ChangelogDocumentationProps) => {
  const router = useRouter();

  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata} fullWidthHero={true}>
      <div className="w-full bg-gradient-to-r py-12 dark:from-gray-900 dark:to-gray-800 sm:py-20">
        <div className="container mx-auto px-8">
          <HeadersType.H1 className="max-w-4xl text-3xl font-semibold leading-[-0.05px]  sm:text-4xl">
            {config?.app?.client} Design System
          </HeadersType.H1>
          <p className="mt-5 max-w-4xl text-lg font-light leading-relaxed text-gray-600 dark:text-gray-300 sm:text-xl">
            A complete design system with components, guidelines, and resources to help teams build consistent, accessible, and beautiful
            digital experiences.
          </p>
          <hr className="mt-16" />
        </div>
      </div>

      <div className="container mx-auto px-8">
        <div className="grid grid-cols-1 gap-6 pb-16 md:grid-cols-3">
          <div className="flex flex-col items-start gap-3 pr-16">
            <p className="flex items-center gap-3 text-sm font-normal text-gray-500 dark:text-gray-400">
              <Layers className="size-3 stroke-[1.5]" />
              Foundations
            </p>
            <h3 className="text-2xl font-medium">Foundations that define the brand across every experience</h3>
            <p className="mb-4 leading-relaxed">A set of design principles and visual guidelines, like color and typography.</p>
            <Button variant="link" className="h-auto px-0 py-0 text-sm font-medium text-gray-900 hover:no-underline dark:text-gray-100">
              <Link href="/foundations/logo">
                <Hexagon className="size-3 stroke-[1.5]" />
                Logo
                <ArrowRight className="inline-block transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="link" className="h-auto px-0 py-0 text-sm font-medium text-gray-900 hover:no-underline dark:text-gray-100">
              <Link href="/foundations/icons">
                <Shapes className="size-3 stroke-[1.5]" />
                Icon Library
                <ArrowRight className="inline-block transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <hr className="my-2 w-28" />
            <Button className="">
              <Link href="/foundations">
                View Foundations
                <ArrowRight className="inline-block transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
          <Link
            href="/foundations/colors"
            className="group mt-2 transition-colors dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-900"
          >
            <div className="flex flex-col items-start gap-2">
              <div className="mb-3 flex max-h-48 w-full items-center justify-center overflow-hidden rounded-md bg-gray-100 dark:bg-gray-900">
                <Image
                  src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/assets/images/colors.svg`}
                  alt="Colors"
                  width={'327'}
                  height="220"
                />
              </div>
              <h3 className="text-base font-medium">Colors</h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                Official color palette used for all digital products.
              </p>
              <Button variant="link" className="px-0 text-sm font-medium text-gray-900 hover:no-underline dark:text-gray-100">
                View Colors
                <ArrowRight className="inline-block transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </Link>
          <Link
            href="/foundations/typography"
            className="group mt-2 transition-colors dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-900"
          >
            <div className="flex flex-col items-start gap-2">
              <div className="mb-3 flex max-h-48 w-full items-center justify-center overflow-hidden rounded-md bg-gray-100 dark:bg-gray-900">
                <Image
                  src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/assets/images/typography.svg`}
                  alt="Typography"
                  width={'327'}
                  height="220"
                />
              </div>
              <h3 className="text-base font-medium">Typography</h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                Official typography system used for all digital products.
              </p>
              <Button variant="link" className="px-0 text-sm font-medium text-gray-900 hover:no-underline dark:text-gray-100">
                View Typography
                <ArrowRight className="inline-block transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </Link>
        </div>
        <hr />
      </div>

      <div className="container mx-auto px-8 pt-16">
        <div className="grid grid-cols-1 gap-6 pb-16 md:grid-cols-3">
          <div className="flex flex-col items-start gap-3 pr-16">
            <p className="flex items-center gap-3 text-sm font-normal text-gray-500 dark:text-gray-400">
              <Component className="size-3 stroke-[1.5]" />
              Design System
            </p>
            <h3 className="text-2xl font-medium">Build and launch with tested and approved components</h3>
            <p className="mb-4 leading-relaxed">
              Components, guidelines, and resources to help teams build consistent, accessible, and beautiful digital experiences.
            </p>
            <Button className="">
              <Link href="/system">
                View Components
                <ArrowRight className="inline-block transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
          <Link
            href="/system"
            className="group mt-2 transition-colors dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-900"
          >
            <div className="flex flex-col items-start gap-2">
              <div className="mb-3 flex max-h-48 w-full items-center justify-center overflow-hidden rounded-md bg-gray-100 dark:bg-gray-900">
                <Image
                  src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/assets/images/colors.svg`}
                  alt="Colors"
                  width={'327'}
                  height="220"
                />
              </div>
              <h3 className="text-base font-medium">Components</h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">Atomic reusable components.</p>
              <Button variant="link" className="px-0 text-sm font-medium text-gray-900 hover:no-underline dark:text-gray-100">
                View Components
                <ArrowRight className="inline-block transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </Link>
          <Link
            href="/system"
            className="group mt-2 transition-colors dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-900"
          >
            <div className="flex flex-col items-start gap-2">
              <div className="mb-3 flex max-h-48 w-full items-center justify-center overflow-hidden rounded-md bg-gray-100 dark:bg-gray-900">
                <Image
                  src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/assets/images/colors.svg`}
                  alt="Colors"
                  width={'327'}
                  height="220"
                />
              </div>
              <h3 className="text-base font-medium">Blocks</h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">Bigger sections used to quickly build pages.</p>
              <Button variant="link" className="px-0 text-sm font-medium text-gray-900 hover:no-underline dark:text-gray-100">
                View Blocks
                <ArrowRight className="inline-block transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </Link>
        </div>
        <hr />
        <div className="prose mt-16 hidden">
          <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
      <Footer config={config} />
    </Layout>
  );
};
export default Home;
