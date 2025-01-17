import Layout from '@/components/Layout/Main';
import HeadersType from '@/components/Typography/Headers';
import { getClientConfig } from '@handoff/config';
import { format } from 'date-fns';
import { Activity, Paintbrush, Sun, Zap } from 'lucide-react';
import type { GetStaticProps } from 'next';
import * as React from 'react';
import { ChangelogDocumentationProps, fetchDocPageMarkdown, getChangelog } from '../../components/util';

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
      config: getClientConfig(),
      changelog: getChangelog(),
    },
  };
};

const ChangeLogPage = ({ content, menu, metadata, current, config, changelog }: ChangelogDocumentationProps) => {
  return (
    <Layout config={config} menu={menu} metadata={metadata} current={current}>
      <div className="flex flex-col gap-2 pb-7">
        <HeadersType.H1>{metadata.title}</HeadersType.H1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{metadata.description}</p>
      </div>
      <div className="lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_280px]">
        <div>
          <h1 className="c-title--extra-large">Latest Changes</h1>
          <p>Everytime the system pulls new data, a commit is made. The differences are shown here.</p>
        </div>
        <Paintbrush />
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
                      <Activity /> Added{' '}
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
                      <Activity /> Added{' '}
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
                      <Activity /> Added{' '}
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
                      <Activity /> Added{' '}
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
                      <Sun /> Changed{' '}
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
                      <Sun /> Changed{' '}
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
                      <Sun /> Changed{' '}
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
                      <Sun /> Changed{' '}
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
                      <Sun /> Removed{' '}
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
                      <Zap /> Removed{' '}
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
                      <Zap /> Removed{' '}
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
                      <Zap /> Removed{' '}
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
    </Layout>
  );
};
export default ChangeLogPage;
