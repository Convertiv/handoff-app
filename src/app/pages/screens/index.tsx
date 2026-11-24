import type { ClientConfig } from '@handoff/types/config';
import type { SectionLink } from '@handoff/nav';
import { ArrowRight } from 'lucide-react';
import type { GetStaticProps } from 'next';
import Link from 'next/link';
import Layout from '../../components/Layout/Main';
import { Icon } from '../../components/Screens/primitives';
import HeadersType from '../../components/Typography/Headers';
import { getClientRuntimeConfig, getNavProps } from '../../components/util';
import { listedScreens, screenRoute, screensManifest } from '../../lib/screens/manifest';

export const getStaticProps: GetStaticProps = async () => ({
  props: { config: getClientRuntimeConfig(), ...(await getNavProps('/screens')) },
});

/** The screens of this project as cards. */
export default function ScreensPage({ config, menu }: { config: ClientConfig; menu: SectionLink[] }) {
  const screens = listedScreens();
  const title = screensManifest.title;
  return (
    <Layout config={config} menu={menu} current={null} metadata={{ title }}>
      <div className="flex flex-col gap-2 pb-8">
        <HeadersType.H1>{title}</HeadersType.H1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">Views built for this design system.</p>
      </div>
      {screens.length === 0 ? (
        <p className="text-sm text-muted-foreground">This project declares no screens.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {screens.map((screen) => (
            <Link
              key={screen.id}
              href={screenRoute(screen.id)}
              className="group flex flex-col gap-3 rounded-lg border bg-background p-5 no-underline transition-colors hover:border-foreground/20 hover:bg-accent/40"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-foreground">
                <Icon name={screen.icon ?? 'wrench'} />
              </span>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {screen.title}
                <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
              {screen.description && <span className="text-[13px] leading-relaxed text-muted-foreground">{screen.description}</span>}
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
