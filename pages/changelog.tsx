import * as React from 'react';
import type { GetStaticProps } from 'next';
import { format } from 'date-fns';
import Icon from 'components/Icon';
import Head from 'next/head';
import { ChangelogDocumentationProps, fetchDocPageMarkdown, getChangelog } from 'components/util';
import Header from 'components/Header';
import CustomNav from 'components/SideNav/Custom';
import { getConfig } from 'config';

const getCountLabel = (count: number, singular: string, plural: string) => {
  if (count === 1) {
    return singular;
  }

  return plural;
};

/**
 * This statically renders content from the markdown, creating menu and providing
 * metadata
 *
 * This is all done statically at build time
 * @param context GetStaticProps
 * @returns
 */
export const getStaticProps: GetStaticProps = async (context) => {
  return {
    props: {
      ...fetchDocPageMarkdown('docs/', 'changelog', `/changelog`).props,
      config: getConfig(),
      changelog: getChangelog(),
    }
  }
};

const ChangeLogPage = ({ content, menu, metadata, current, config, changelog }: ChangelogDocumentationProps) => {
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
              <h1 className="c-title--extra-large">Latest Changes</h1>
              <p>Everytime the system pulls new data, a commit is made. The differences are shown here.</p>
            </div>
            <Icon name="hero-design" className="c-hero__img c-hero__img--small" />
          </div>
          <div className="u-pt-6 u-pr-9 u-pl-9 u-pb-6 c-card c-card--grey">
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
                          <Icon name="activity" /> Added{' '}
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
                          <Icon name="activity" /> Added{' '}
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
                          <Icon name="activity" /> Added{' '}
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
                          <Icon name="activity" /> Added{' '}
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
                          <Icon name="sun" /> Changed{' '}
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
                          <Icon name="sun" /> Changed{' '}
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
                          <Icon name="sun" /> Changed{' '}
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
                          <Icon name="sun" /> Changed{' '}
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
                          <Icon name="zap" /> Removed{' '}
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
                          <Icon name="zap" /> Removed{' '}
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
                          <Icon name="zap" /> Removed{' '}
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
                          <Icon name="zap" /> Removed{' '}
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
      </section>
    </div>
  );
};
export default ChangeLogPage;
