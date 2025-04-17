import { FontFamily } from '@handoff/types/font';
import sortedUniq from 'lodash/sortedUniq';
import type * as next from 'next';
import { ReactElement, ReactMarkdown } from 'react-markdown/lib/react-markdown';
import rehypeRaw from 'rehype-raw';
import { DownloadTokens } from '../../components/DownloadTokens';
import TypographyExamples from '../../components/Foundations/TypographyExample';
import Layout from '../../components/Layout/Main';
import { MarkdownComponents } from '../../components/Markdown/MarkdownComponents';
import HeadersType from '../../components/Typography/Headers';
import { fetchFoundationDocPageMarkdown, FoundationDocumentationProps, getClientRuntimeConfig, getTokens } from '../../components/util';

export interface typographyTypes {
  [key: string]: ReactElement;
}

/**
 * This statically renders content from the markdown, creating menu and providing
 * metadata
 *
 * This is all done statically at build time
 * @param context GetStaticProps
 * @returns
 */
export const getStaticProps: next.GetStaticProps = async () => {
  return {
    props: {
      ...fetchFoundationDocPageMarkdown('docs/foundations/', 'typography', `/foundations`).props,
      config: getClientRuntimeConfig(),
      design: getTokens().design,
    },
  };
};

const Typography = ({
  content,
  menu,
  metadata,
  current,
  scss,
  css,
  styleDictionary,
  types,
  config,
  design,
}: FoundationDocumentationProps) => {
  const typography = design.typography.slice().sort((a, b) => {
    const l = (config?.app?.type_sort ?? []).indexOf(a.name) >>> 0;
    const r = (config?.app?.type_sort ?? []).indexOf(b.name) >>> 0;
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

  const type_copy = config?.app?.type_copy ?? 'Almost before we knew it, we had left the ground.';

  return (
    <Layout config={config} menu={menu} metadata={metadata} current={current}>
      <div className="flex flex-col gap-2 pb-7">
        <HeadersType.H1>{metadata.title}</HeadersType.H1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{metadata.description}</p>
        <DownloadTokens componentId="colors" scss={scss} css={css} styleDictionary={styleDictionary} types={types} />
      </div>
      <div className="mb-10">
        <h2 className="mb-3 text-2xl font-medium">Typography</h2>
        <p className="mb-8">Typographic system establishes scale, sizes and weight of text.</p>
        {Object.keys(families).map((key) => (
          <div className="rounded-lg bg-gray-50 p-10" key={key}>
            <p className="mb-1 text-sm">Typeface</p>
            <div className="" style={{ fontFamily: key }}>
              <p className="mb-3 text-3xl leading-relaxed text-gray-900 dark:text-gray-100">{key}</p>
              <p className="mb-2 break-all text-xs  tracking-[0.3em] text-gray-400">ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz</p>
              <p className=" break-all text-xs  tracking-[0.3em] text-gray-400">
                1234567890&apos;?&quot;!&quot;(%)[#]@/&amp;\-+÷×=®©$€£¥¢:;,.*
              </p>
            </div>
          </div>
        ))}
      </div>

      <HeadersType.H2>Hierarchy</HeadersType.H2>
      <p className="mb-8">Use for palette of colors containing many shades.</p>
      <TypographyExamples types={typography} />

      <ReactMarkdown className="prose" components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </Layout>
  );
};
export default Typography;

/**
 *
 *       {Object.keys(families).map((key) => (
        <div className="c-typography__preview-big" key={`family-${key}`}>
          <div className="o-row u-justify-between">
            <div className="o-col-4@md u-mb-4 u-mb-0@md">
              <small>Typeface</small>
              <h2 style={{ fontFamily: key }}>{key}</h2>
              <hr />
              <p>Primary font used, related assets can be found in the assets page.</p>
              <p>
                <NavLink href="/assets/fonts">Download Fonts</NavLink>
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

 *   <div className="o-row">
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
                          <Icon name="link" className="o-icon" />
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
                    {renderTypes(type, copy)[type.name] ?? <span style={pluckStyle(type)}>{type_copy}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
 */
