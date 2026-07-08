import * as fs from 'fs-extra';
import uniq from 'lodash/uniq';
import { FileArchive } from 'lucide-react';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import path from 'path';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import Footer from '../../components/Footer';
import { MarkdownComponents, remarkCodeMeta } from '../../components/Markdown/MarkdownComponents';
import Header from '../../components/old/Header';
import { buildTimeFoundationDesign, fetchDocPageMarkdown, FontDocumentationProps, getClientRuntimeConfig } from '../../components/util';
import { useFoundationTokens } from '../../components/util/useFoundationTokens';

const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';
const isRegistry = process.env.HANDOFF_RUNTIME_MODE === 'registry';

/**
 * This statically renders content from the markdown, creating menu and providing
 * metadata
 *
 * This is all done statically at build time
 * @param context GetStaticProps
 * @returns
 */
export const getStaticProps: GetStaticProps = async () => {
  // Workspace/static reads the mirrored font archives; a registry build has none (hydrated at runtime).
  const customFonts: string[] = [];
  try {
    const fontDir = path.resolve(process.env.HANDOFF_MODULE_PATH ?? '', '.handoff', `${process.env.HANDOFF_PROJECT_ID}`, 'public', 'fonts');
    for (const font of fs.readdirSync(fontDir)) {
      if (font.endsWith('.zip')) customFonts.push(font.replace('.zip', ''));
    }
  } catch {
    // No local font archives (e.g. a registry build), so customFonts stays empty.
  }

  return {
    props: {
      ...(await fetchDocPageMarkdown('docs/assets/', 'fonts', `/assets`)).props,
      design: buildTimeFoundationDesign(),
      config: getClientRuntimeConfig(),
      customFonts,
    },
  };
};

const FontsPage = ({ content, menu, metadata, customFonts, design, config }: FontDocumentationProps) => {
  // Registry hydrates typography tokens (for the family list) + the published font archives at runtime.
  const tokens = useFoundationTokens('typography', { design });
  const [hydratedFonts, setHydratedFonts] = React.useState<string[]>(customFonts);
  React.useEffect(() => {
    if (!isRegistry) return;
    let active = true;
    fetch(`${basePath}/api/docs/assets/fonts`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.assets) return;
        const names = (data.assets as { path: string }[])
          .filter((a) => typeof a.path === 'string' && /^fonts\/.+\.zip$/i.test(a.path))
          .map((a) => a.path.slice('fonts/'.length).replace(/\.zip$/i, ''));
        setHydratedFonts(names);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const typography = tokens.design?.typography ?? [];
  const fontFamilies: string[] = uniq(typography.map((type) => type.values.fontFamily));
  const fontLinks: string[] = fontFamilies.map((fontFamily) => {
    const machineName = fontFamily.replace(/\s/g, '');
    const custom = hydratedFonts.find((font) => font === machineName);
    if (custom) {
      return isRegistry ? `${basePath}/api/docs/assets/fonts/fonts/${machineName}.zip` : `/fonts/${machineName}.zip`;
    }
    return `https://fonts.google.com/specimen/${fontFamily}`;
  });
  return (
    <div className="c-page">
      <Head>
        <title>{metadata.metaTitle}</title>
        <meta name="description" content={metadata.metaDescription} />
      </Head>
      <Header menu={menu} config={config} />
      <section className="c-content">
        <div className="o-container-fluid">
          <div className="c-hero">
            <div>
              <h1>{metadata.title}</h1>
              <p>{metadata.description}</p>
            </div>
          </div>
          {fontFamilies.map((fontFamily, i) => (
            <React.Fragment key={fontFamily}>
              <div className="o-row u-justify-between">
                <div className="o-col-5@md">
                  <h4>{fontFamily}</h4>
                </div>
                <div className="o-col-6@md">
                  <div className="c-card">
                    <FileArchive />
                    <h4>{fontFamily}</h4>
                    <p>Font files for installing on a local machine.</p>
                    <p>
                      <a href={fontLinks[i]}>Download Font</a>
                    </p>
                  </div>
                </div>
              </div>
              <hr />
            </React.Fragment>
          ))}

          <div className="prose">
            <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm, remarkCodeMeta]} rehypePlugins={[rehypeRaw]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </section>
      <Footer config={config} />
    </div>
  );
};
export default FontsPage;
