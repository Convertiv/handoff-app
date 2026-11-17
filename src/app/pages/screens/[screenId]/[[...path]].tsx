import type { ClientConfig } from '@handoff/types/config';
import type { SectionLink } from '@handoff/nav';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout/Main';
import { ScreenHost } from '../../../components/Screens/ScreenHost';
import { getClientRuntimeConfig, getNavProps } from '../../../components/util';
import { findScreen, isFullscreenPath, isScreenAvailable, screensManifest } from '../../../lib/screens/manifest';

/**
 * A screen at `/screens/<id>`, with its own path segments after it. The screen renders in the
 * browser: its data comes from the collection API, so the build prerenders only the frame.
 */
export const getStaticPaths: GetStaticPaths = async () => ({
  paths: screensManifest.screens.filter(isScreenAvailable).map((screen) => ({ params: { screenId: screen.id, path: [] } })),
  // A static export can serve only the screen roots; a live app serves every path of a screen.
  fallback: process.env.HANDOFF_BUILD_TARGET === 'static' ? false : 'blocking',
});

export const getStaticProps: GetStaticProps = async (context) => {
  const screen = findScreen(context.params?.screenId as string);
  if (!screen) return { notFound: true };
  const path = context.params?.path;
  return {
    props: {
      config: getClientRuntimeConfig(),
      ...(await getNavProps('/screens')),
      screenId: screen.id,
      path: Array.isArray(path) ? path : [],
    },
  };
};

const toParams = (path: string | string[] | undefined): string[] => (Array.isArray(path) ? path : path ? path.split('/') : []);

export default function ScreenPage({
  config,
  menu,
  screenId,
  path,
}: {
  config: ClientConfig;
  menu: SectionLink[];
  screenId: string;
  path: string[];
}) {
  const router = useRouter();
  const screen = findScreen(screenId);
  if (!screen) return null;
  // The rendered path decides the first frame, so a fullscreen link never shows the header. A shallow
  // navigation changes only the query, so the query decides after that.
  const params = router.isReady ? toParams(router.query.path) : path;
  return (
    <Layout
      config={config}
      menu={menu}
      current={null}
      metadata={{ title: screen.title, metaDescription: screen.description }}
      fullBleed
      fullscreen={isFullscreenPath(screen, params)}
    >
      <ScreenHost screen={screen} />
    </Layout>
  );
}
