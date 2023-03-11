import * as React from 'react';
import type { GetStaticProps, NextPage } from 'next';
import sortedUniq from 'lodash/sortedUniq';
import sortBy from 'lodash/sortBy';

import type { TypographyObject } from 'figma-exporter/src/types';
import { getConfig } from 'config';
import Icon from 'components/Icon';

import NavLink from 'components/NavLink';
import { FontFamily } from 'types/font';
import Head from 'next/head';
import Header from 'components/Header';
import { DocumentationProps, fetchDocPageMarkdown, SectionLink, staticBuildMenu } from 'components/util';
import CustomNav from 'components/SideNav/Custom';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import { MarkdownComponents } from 'components/util/MarkdownComponents';
import rehypeRaw from 'rehype-raw';

const config = getConfig();

const pluckStyle = (type: TypographyObject) => {
  return {
    fontFamily: type.values.fontFamily,
    fontSize: type.values.fontSize,
    fontWeight: type.values.fontWeight,
    lineHeight: type.values.lineHeightPx + 'px',
  };
};

const typography = config.design.typography.slice().sort((a, b) => {
  const l = config.type_sort.indexOf(a.name) >>> 0;
  const r = config.type_sort.indexOf(b.name) >>> 0;

  return l !== r ? l - r : a.name.localeCompare(b.name);
});

const families: FontFamily = typography.reduce((result, current) => {
  return {
    ...result,
    [current.values.fontFamily]: result[current.values.fontFamily]
      ? // sorts and returns unique font weights
        sortedUniq([...result[current.values.fontFamily], current.values.fontWeight].sort((a, b) => a - b))
      : [current.values.fontWeight],
  };
}, {} as FontFamily);

const type_copy = config.type_copy ? config.type_copy : 'Almost before we knew it, we had left the ground.';

/**
 * This statically renders content from the markdown, creating menu and providing
 * metadata
 *
 * This is all done statically at build time
 * @param context GetStaticProps
 * @returns
 */
export const getStaticProps: GetStaticProps = async (context) => {
  // Read current slug
  return fetchDocPageMarkdown('docs/foundations/', 'typography', `/foundations`);
};

const Typography = ({ content, menu, metadata, current }: DocumentationProps) => {
  const [copy, setCopy] = React.useState('Copy link to clipboard');

  return (
    <div className="c-page">
      <Head>
        <title>{metadata.metaTitle}</title>
        <meta name="description" content={metadata.metaDescription} />
      </Head>
      <Header menu={menu} />
      {current.subSections.length > 0 && <CustomNav menu={current} />}
      <section className="c-content">
        <div className="o-container-fluid">
          <div className="c-hero">
            <div>
              <h1 className="c-title--extra-large">{metadata.title}</h1>
              <p>{metadata.description}</p>
            </div>
            {metadata.image && <Icon name={metadata.image} className="c-hero__img c-hero__img--small" />}
          </div>
          {Object.keys(families).map((key) => (
            <div className="c-typography__preview-big" key={`family-${key}`}>
              <div className="o-row u-justify-between">
                <div className="o-col-4@md u-mb-4 u-mb-0@md">
                  <small>Typeface</small>
                  <h2 style={{ fontFamily: key }}>{key}</h2>
                  <hr />
                  <p>Primary font used, related assets can be found in the assets page.</p>
                  <p>
                    <NavLink href="/assets/fonts">
                      Download Fonts <Icon name="arrow-right" />
                    </NavLink>
                  </p>
                </div>
                <div className="o-col-7@md">
                  <div className="o-row o-row--no-gutters">
                    {families[key].map((weight) => (
                      <div
                        className="c-typography__preview-weight"
                        style={{ fontWeight: weight, fontFamily: key }}
                        key={`family-${weight}-${key}`}
                      >
                        <h2>Aa</h2>
                        <p>{weight}</p>
                      </div>
                    ))}
                  </div>
                  <div className="o-row" style={{ fontFamily: key }}>
                    <h3>ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz</h3>
                    <h3>1234567890‘?’“!”(%)[#]@/&\-+÷×=®©$€£¥¢:;,.*</h3>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="o-row">
            <div className="o-col-10@md">
              <div>
                <h3>Type Scale</h3>
                <p>
                  Nullam tempor nunc ut tempus vehicula. Duis dignissim sem id nulla tempus, eget cursus sapien efficitur. Suspendisse
                  convallis odio a dui congue vulputate.
                </p>
              </div>
            </div>
          </div>
          <div>
            {typography.map((type) => (
              <div className="c-typography__preview" id={type.machine_name} key={type.machine_name}>
                <div className="o-row">
                  <div className="o-col-3@md u-mb-4 u-mb-0@md">
                    <h6>
                      {type.name}
                      <a
                        href={`#${type.machine_name}`}
                        className="c-tooltip"
                        data-tooltip={copy}
                        onMouseEnter={(e) => setCopy('Copy link to clipboard')}
                        onClick={(e) => {
                          e.preventDefault();
                          if (window) {
                            navigator.clipboard.writeText(
                              'https://' + window.location.host + window.location.pathname + '#' + type.machine_name
                            );
                            setCopy('Copied');
                          }
                          return false;
                        }}
                      >
                        <span>
                          <Icon name="link" />
                        </span>
                      </a>
                    </h6>
                    <p>
                      {type.values.fontFamily} · {type.values.fontWeight}
                    </p>
                    <p>
                      {type.values.fontSize}px · {(type.values.lineHeightPx / type.values.fontSize).toFixed(1)}
                    </p>
                  </div>
                  <div className="o-col-9@md">
                    {{
                      Subheading: <h1 style={pluckStyle(type)}></h1>,
                      'Heading 1': <h1 style={pluckStyle(type)}>{type_copy}</h1>,
                      'Heading 2': <h2 style={pluckStyle(type)}>{type_copy}</h2>,
                      'Heading 3': <h3 style={pluckStyle(type)}>{type_copy}</h3>,
                      'Heading 4': <h4 style={pluckStyle(type)}>{type_copy}</h4>,
                      'Heading 5': <h5 style={pluckStyle(type)}>{type_copy}</h5>,
                      'Heading 6': <h6 style={pluckStyle(type)}>{type_copy}</h6>,
                      'Input Labels': <label style={pluckStyle(type)}>{type_copy}</label>,
                      Blockquote: <blockquote style={pluckStyle(type)}>{type_copy}</blockquote>,
                      Link: <a style={pluckStyle(type)}>{type_copy}</a>,
                      Paragraph: <p style={pluckStyle(type)}>{type_copy}</p>,
                    }[type.name] ?? <span style={pluckStyle(type)}>{type_copy}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};
export default Typography;
