import type { GetStaticProps } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Layout from '../../../components/Layout/Main';
import HeadersType from '../../../components/Typography/Headers';
import { getClientRuntimeConfig, staticBuildMenu } from '../../../components/util';
import type { TypeCatalog } from '@handoff/transformers/type-catalog';
import { AlertTriangle, Type } from 'lucide-react';
import { cn } from '../../../lib/utils';

type TypesPageProps = {
  menu: ReturnType<typeof staticBuildMenu>;
  current: ReturnType<typeof staticBuildMenu>[0] | null;
  config: ReturnType<typeof getClientRuntimeConfig>;
  metadata: { title: string; description: string };
};

export const getStaticProps: GetStaticProps = async () => {
  const menu = staticBuildMenu();
  const config = getClientRuntimeConfig();
  const current = menu.filter((section) => section.path === '/system')[0] ?? null;
  return {
    props: {
      menu,
      current,
      config,
      metadata: {
        title: 'Types',
        description:
          'Type catalog and reuse across components. See where types are used and spot similar or duplicate type shapes.',
      },
    } as TypesPageProps,
  };
};

const basePath = () => (typeof window !== 'undefined' ? process.env.HANDOFF_APP_BASE_PATH ?? '' : '');

const TypesPage = ({ menu, current, config, metadata }: TypesPageProps) => {
  const [catalog, setCatalog] = useState<TypeCatalog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = `${basePath()}/api/types.json`;
    fetch(path)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setCatalog(data as TypeCatalog | null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout config={config} menu={menu} current={current} metadata={metadata}>
        <div className="flex flex-col gap-2 pb-7">
          <HeadersType.H1>{metadata.title}</HeadersType.H1>
          <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">Loading type catalog…</p>
        </div>
      </Layout>
    );
  }

  const namedTypes = catalog?.namedTypes ?? {};
  const shapeClusters = catalog?.shapeClusters ?? {};
  const namedEntries = Object.entries(namedTypes);
  const reuseNamed = namedEntries.filter(([, entry]) => entry.usages.length > 1);
  const similarShapes = Object.entries(shapeClusters).filter(([, entry]) => {
    const components = new Set(entry.usages.map((u) => u.componentId));
    const generics = new Set(entry.usages.map((u) => u.generic ?? '').filter(Boolean));
    return components.size > 1 || generics.size > 1;
  });

  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      <div className="flex flex-col gap-2 pb-7">
        <HeadersType.H1>{metadata.title}</HeadersType.H1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{metadata.description}</p>
      </div>

      {(reuseNamed.length > 0 || similarShapes.length > 0) && (
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-medium">
            <AlertTriangle className="size-5 text-amber-500" />
            Reuse & similar types
          </h2>
          <div className="space-y-4">
            {reuseNamed.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Named type used in multiple places</h3>
                <ul className="space-y-3">
                  {reuseNamed.map(([typeName, entry]) => (
                    <li
                      key={typeName}
                      className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-800/80"
                    >
                      <span className="font-mono text-sm font-medium">{typeName}</span>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        Used in {entry.usages.length} place{entry.usages.length === 1 ? '' : 's'}:
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {entry.usages.map((u) => (
                          <li key={`${u.componentId}-${u.propertyPath}`}>
                            <Link
                              href={`${basePath()}/system/component/${u.componentId}#properties`}
                              className="text-sm text-sky-600 hover:underline dark:text-sky-400"
                            >
                              {u.componentId} ({u.propertyPath})
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {similarShapes.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Same structure in multiple components</h3>
                <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                  Consider reusing a shared type for these.
                </p>
                <ul className="space-y-3">
                  {similarShapes.map(([shapeId, entry]) => (
                    <li
                      key={shapeId}
                      className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-800/80"
                    >
                      <code className="block text-xs text-gray-600 dark:text-gray-400">{entry.shapeSummary}</code>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {entry.usages.length} usage{entry.usages.length === 1 ? '' : 's'} across{' '}
                        {new Set(entry.usages.map((u) => u.componentId)).size} component
                        {new Set(entry.usages.map((u) => u.componentId)).size === 1 ? '' : 's'}:
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {entry.usages.map((u) => (
                          <li key={`${u.componentId}-${u.propertyPath}`}>
                            <Link
                              href={`${basePath()}/system/component/${u.componentId}#properties`}
                              className="text-sm text-sky-600 hover:underline dark:text-sky-400"
                            >
                              {u.componentId} ({u.propertyPath})
                              {u.generic ? ` — ${u.generic}` : ''}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-xl font-medium">
          <Type className="size-5" />
          Type catalog
        </h2>
        {namedEntries.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">No named types documented yet. Add TypeScript or CSF components with typed props to see them here.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {namedEntries.map(([typeName, entry]) => (
              <div
                key={typeName}
                className={cn(
                  'rounded-lg border p-4',
                  entry.usages.length > 1
                    ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20'
                    : 'border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-800/80'
                )}
              >
                <span className="font-mono text-sm font-medium">{typeName}</span>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {entry.usages.length} use{entry.usages.length === 1 ? '' : 's'}
                </p>
                <ul className="mt-2 space-y-1">
                  {entry.usages.slice(0, 5).map((u) => (
                    <li key={`${u.componentId}-${u.propertyPath}`}>
                      <Link
                        href={`${basePath()}/system/component/${u.componentId}#properties`}
                        className="text-xs text-sky-600 hover:underline dark:text-sky-400"
                      >
                        {u.componentId} → {u.propertyPath}
                      </Link>
                    </li>
                  ))}
                  {entry.usages.length > 5 && (
                    <li className="text-xs text-gray-500">+{entry.usages.length - 5} more</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default TypesPage;
