import * as fs from 'fs-extra';
import uniq from 'lodash/uniq';
import { FileArchive } from 'lucide-react';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import path from 'path';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Footer from '../../components/Footer';
import { MarkdownComponents } from '../../components/Markdown/MarkdownComponents';
import Header from '../../components/old/Header';
import { fetchDocPageMarkdown, FontDocumentationProps, getClientRuntimeConfig, getTokens } from '../../components/util';

/**
 * This statically renders content from the markdown, creating menu and providing
 * metadata
 *
 * This is all done statically at build time
 * @param context GetStaticProps
 * @returns
 */
export const getStaticProps: GetStaticProps = async (context) => {
  const fonts = fs.readdirSync(
    path.resolve(process.env.HANDOFF_MODULE_PATH ?? '', '.handoff', `${process.env.HANDOFF_PROJECT_ID}`, 'public', 'fonts')
  );
  const customFonts: string[] = [];

  fonts.map((font) => {
    if (font.endsWith('.zip')) {
      // We have a custom font
      const name = font.replace('.zip', '');
      customFonts.push(name);
    }
  });

  return {
    props: {
      ...fetchDocPageMarkdown('docs/assets/', 'fonts', `/assets`).props,
      design: getTokens().localStyles,
      config: getClientRuntimeConfig(),
      customFonts,
    },
  };
};

const FontsPage = ({ content, menu, metadata, current, customFonts, design, config }: FontDocumentationProps) => {
  const fontFamilies: string[] = uniq(design.typography.map((type) => type.values.fontFamily));
  const fontLinks: string[] = fontFamilies.map((fontFamily) => {
    const machine_name = fontFamily.replace(/\s/g, '');
    const custom = customFonts.find((font) => font === machine_name);
    if (custom) {
      return `/fonts/${machine_name}.zip`;
    } else {
      return `https://fonts.google.com/specimen/${fontFamily}`;
    }
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
            <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
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
