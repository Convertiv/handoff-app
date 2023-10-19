import * as React from 'react';
import type { GetStaticProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import classNames from 'classnames';
import { getConfig } from '../../config';
import Icon from '../components/Icon';
import Head from 'next/head';
import Header from '../components/Header';
import { fetchDocPageMarkdown, getChangelog, ChangelogDocumentationProps } from '../components/util';
import { MarkdownComponents } from '../components/Markdown/MarkdownComponents';
import rehypeRaw from 'rehype-raw';

const getCountLabel = (count: number, singular: string, plural: string) => {
  if (count === 1) {
    return singular;
  }

  return plural;
};

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
      config: getConfig(),
      changelog: getChangelog(),
    },
  };
};

const Home = ({ content, menu, metadata, config, changelog }: ChangelogDocumentationProps) => {
  const router = useRouter();

  return (
    <div>
      <Head>
        <title>{metadata.metaTitle}</title>
        <meta name="description" content={metadata.metaDescription} />
      </Head>
      <Header menu={menu} config={config} />
      <div className="o-container u-mt-6">
        <div className="o-row u-justify-center">
          <div className="o-col-10">
            <div className="u-pt-6 u-pr-9@xlg u-pl-9@xl u-pb-4 u-mb-2 u-mb-5@lg u-mt-2 u-mt-5@lg u-text-center">
              <h1 className="c-title--extra-large u-animation-fadein">
                <strong>{config.client} Design System</strong> for building better user experiences.
              </h1>
            </div>
            <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
              {content}
            </ReactMarkdown>
          </div>
          <div className="o-col-6@lg u-animation-fadein">
            <div className="c-card c-card--blue-gradient u-pt-6@xl u-pl-7@xl u-pr-7@xl u-pb-0">
              <h3>
                <strong>Components</strong>
              </h3>
              <hr className="u-mt-2 u-mb-2"></hr>
              <h3 className="u-mb-4">Building blocks for all digital {config.client} experiences.</h3>
              <Link href="/components" className="c-button c-button--primary u-pl-5 u-mb-5 u-pr-5">
                View Components
              </Link>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${process.env.NEXT_BASE_PATH}/assets/images/components.png`} width={1528} height={1250} alt="Components" />
            </div>
          </div>
          <div className="o-col-6@lg u-animation-fadein">
            <div className="u-pt-6@xl u-pr-9@xl u-pl-9@xl u-pb-6@xl c-card c-card--grey">
              <h3>Design Foundations</h3>
              <p>Sets of recommendations on how to apply design principles to provide a positive user experience.</p>
              <ul className="c-list--boxed u-pt-2">
                <li>
                  <Link
                    href="/foundations/typography"
                    className={classNames({ 'is-selected': router.asPath === '/foundations/typography' })}
                  >
                    Explore Typography <Icon name="arrow-right" className="o-icon" />
                  </Link>
                </li>
                <li>
                  <Link href="/foundations/colors" className={classNames({ 'is-selected': router.asPath === '/foundations/colors' })}>
                    Explore Colors <Icon name="arrow-right" className="o-icon" />
                  </Link>
                </li>
                <li>
                  <Link href="/foundations/logo" className={classNames({ 'is-selected': router.asPath === '/foundations/logo' })}>
                      Explore Logos <Icon name="arrow-right" className="o-icon" />
                  </Link>
                </li>
                <li>
                  <a href="/tokens.zip">
                    Download All Tokens <Icon name="arrow-right" className="o-icon" />
                  </a>
                </li>
              </ul>
            </div>
            <div className="u-pt-6@xl u-pr-9@xl u-pl-9@xl u-pb-6@xl c-card c-card--grey">
              <h3>Latest Changes</h3>
              <p>This is an example of description.</p>
              {changelog.map((changelogRecord, index) => {
                const date = new Date(changelogRecord.timestamp);
                const added = {
                  colors: (changelogRecord.design?.colors ?? []).filter((item) => item.type === 'add'),
                  typography: (changelogRecord.design?.typography ?? []).filter((item) => item.type === 'add'),
                  icons: (changelogRecord.assets?.icons ?? []).filter((item) => item.type === 'add'),
                  logos: (changelogRecord.assets?.logos ?? []).filter((item) => item.type === 'add'),
                };

                const changed = {
                  colors: (changelogRecord.design?.colors ?? []).filter((item) => item.type === 'change'),
                  typography: (changelogRecord.design?.typography ?? []).filter((item) => item.type === 'change'),
                  icons: (changelogRecord.assets?.icons ?? []).filter((item) => item.type === 'change'),
                  logos: (changelogRecord.assets?.logos ?? []).filter((item) => item.type === 'change'),
                };

                const deleted = {
                  colors: (changelogRecord.design?.colors ?? []).filter((item) => item.type === 'delete'),
                  typography: (changelogRecord.design?.typography ?? []).filter((item) => item.type === 'delete'),
                  icons: (changelogRecord.assets?.icons ?? []).filter((item) => item.type === 'delete'),
                  logos: (changelogRecord.assets?.logos ?? []).filter((item) => item.type === 'delete'),
                };

                return (
                  <React.Fragment key={`${changelogRecord.timestamp}_${index}`}>
                    <small>Changes on {format(date, 'MMMM do, yyyy')}</small>
                    <ul className="c-list--boxed u-pt-2">
                      {added.colors.length > 0 && (
                        <li>
                          <p>
                            <Icon name="activity" className="o-icon" /> Added{' '}
                            <strong>
                              {added.colors.length} {getCountLabel(added.colors.length, 'color', 'colors')}
                            </strong>
                            .
                          </p>
                        </li>
                      )}
                      {added.typography.length > 0 && (
                        <li>
                          <p>
                            <Icon name="activity" className="o-icon" /> Added{' '}
                            <strong>
                              {added.typography.length} {getCountLabel(added.typography.length, 'typography', 'typographies')}
                            </strong>
                            .
                          </p>
                        </li>
                      )}
                      {added.icons.length > 0 && (
                        <li>
                          <p>
                            <Icon name="activity" className="o-icon" /> Added{' '}
                            <strong>
                              {added.icons.length} {getCountLabel(added.icons.length, 'icon', 'icons')}
                            </strong>
                            .
                          </p>
                        </li>
                      )}
                      {added.logos.length > 0 && (
                        <li>
                          <p>
                            <Icon name="activity" className="o-icon" /> Added{' '}
                            <strong>
                              {added.logos.length} {getCountLabel(added.logos.length, 'logo', 'logos')}
                            </strong>
                            .
                          </p>
                        </li>
                      )}

                      {changed.colors.length > 0 && (
                        <li>
                          <p>
                            <Icon name="sun" className="o-icon" /> Changed{' '}
                            <strong>
                              {changed.colors.length} {getCountLabel(changed.colors.length, 'color', 'colors')}
                            </strong>
                            .
                          </p>
                        </li>
                      )}
                      {changed.typography.length > 0 && (
                        <li>
                          <p>
                            <Icon name="sun" className="o-icon" /> Changed{' '}
                            <strong>
                              {changed.typography.length} {getCountLabel(changed.typography.length, 'typography', 'typographies')}
                            </strong>
                            .
                          </p>
                        </li>
                      )}
                      {changed.icons.length > 0 && (
                        <li>
                          <p>
                            <Icon name="sun" className="o-icon" /> Changed{' '}
                            <strong>
                              {changed.icons.length} {getCountLabel(changed.icons.length, 'icon', 'icons')}
                            </strong>
                            .
                          </p>
                        </li>
                      )}
                      {changed.logos.length > 0 && (
                        <li>
                          <p>
                            <Icon name="sun" className="o-icon" /> Changed{' '}
                            <strong>
                              {changed.logos.length} {getCountLabel(changed.logos.length, 'logo', 'logos')}
                            </strong>
                            .
                          </p>
                        </li>
                      )}

                      {deleted.colors.length > 0 && (
                        <li>
                          <p>
                            <Icon name="zap" className="o-icon" /> Removed{' '}
                            <strong>
                              {deleted.colors.length} {getCountLabel(deleted.colors.length, 'color', 'colors')}
                            </strong>
                            .
                          </p>
                        </li>
                      )}
                      {deleted.typography.length > 0 && (
                        <li>
                          <p>
                            <Icon name="zap" className="o-icon" /> Removed{' '}
                            <strong>
                              {deleted.typography.length} {getCountLabel(deleted.typography.length, 'typography', 'typographies')}
                            </strong>
                            .
                          </p>
                        </li>
                      )}
                      {deleted.icons.length > 0 && (
                        <li>
                          <p>
                            <Icon name="zap" className="o-icon" /> Removed{' '}
                            <strong>
                              {deleted.icons.length} {getCountLabel(deleted.icons.length, 'icon', 'icons')}
                            </strong>
                            .
                          </p>
                        </li>
                      )}
                      {deleted.logos.length > 0 && (
                        <li>
                          <p>
                            <Icon name="zap" className="o-icon" /> Removed{' '}
                            <strong>
                              {deleted.logos.length} {getCountLabel(deleted.logos.length, 'logo', 'logos')}
                            </strong>
                            .
                          </p>
                        </li>
                      )}
                    </ul>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
