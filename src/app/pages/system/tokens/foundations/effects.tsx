import { getClientConfig } from '@handoff/config';
import { EffectObject } from '@handoff/types';
import { groupBy, upperFirst } from 'lodash';
import type { GetStaticProps } from 'next';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Layout from '../../../../components/Layout/Main';
import { MarkdownComponents } from '../../../../components/Markdown/MarkdownComponents';
import HeadersType from '../../../../components/Typography/Headers';
import { Table, TableBody, TableCell, TableRow } from '../../../../components/ui/table';
import { fetchComponents, fetchDocPageMarkdown, FoundationDocumentationProps, getTokens } from '../../../../components/util';

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
  const components = fetchComponents().map((c) => c.id);
  const config = getClientConfig();
  return {
    ...{
      props: {
        config,
        ...fetchDocPageMarkdown('docs/', 'system/tokens/foundations/effects', `/system`).props,
        design: getTokens().design,
      } as FoundationDocumentationProps,
    },
  };
};
/**
 * Define the components page
 * @param param0
 * @returns
 */
const ComponentsPage = ({ content, menu, metadata, current, config, design }: FoundationDocumentationProps) => {
  // Fetch components from api

  const effectGroups = Object.fromEntries(
    Object.entries(groupBy(design.effect, 'group')).map(([groupKey, effects]) => {
      return [
        groupKey,
        effects.map((effectObj) => {
          return {
            ...effectObj,
          };
        }),
      ] as const;
    })
  );

  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      <div className="flex flex-col gap-2 pb-7">
        <HeadersType.H1>{metadata.title}</HeadersType.H1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{metadata.description}</p>
      </div>
      <div className="mt-10">
        <ReactMarkdown className="prose" components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
          {content}
        </ReactMarkdown>

        {Object.keys(effectGroups).map((group) => (
          <div key={group} className="mb-8">
            <h3 className="mb-4 text-lg font-medium" id={`${group}-colors`}>
              {upperFirst(group)}
            </h3>
            <EffectsTable group={group} effects={effectGroups[group]} />
          </div>
        ))}
      </div>
    </Layout>
  );
};

const EffectsTable = ({ group, effects }: { group: string; effects: EffectObject[] }) => {
  return (
    <Table>
      <TableBody>
        {effects.map((effect) => (
          <TableRow key={effect.id} className="h-12">
            <TableCell>{effect.reference}</TableCell>
            <TableCell className="text-right">{effect.effects.map((effect) => effect.value).join(', ') || 'none'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ComponentsPage;
