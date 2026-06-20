import escape from 'lodash/escape';
import { parse } from 'node-html-parser';
import { SHARED_MAIN_CSS_ARTIFACT_PATH, SHARED_MAIN_JS_ARTIFACT_PATH } from '../../../artifacts';
import { buildArtifactUrl } from '../../../artifacts/url';
import type { ComponentArtifactPresence, SharedArtifactPresence } from '../component/shared-artifacts';

/**
 * Composes multiple component preview HTML documents into a single-page HTML.
 *
 * Each component preview may be a React SSR document (server-rendered markup plus a `#root` /
 * `#__APP_PROPS__` pair) or a static Handlebars document.
 *
 * React client/hydration bundles are component-owned artifacts (`component/<id>.client.js`,
 * technical design §7) rather than inline scripts. This composer therefore copies no per-fragment
 * bundle: it namespaces each fragment's root/props so multiple instances coexist, marks each root
 * with the `data-handoff-component`/`data-handoff-props` attributes the component bundle hydrates by,
 * and references each unique component's client artifact exactly once.
 *
 * Shared/global artifacts follow the shared-artifact model: `component/main.css` and
 * `component/main.js` are referenced only when present, and the global script is emitted exactly once
 * (deduplicated across fragments) so its top-level side effects run a single time, ahead of the
 * per-component client bundles.
 */
export const composePatternHtml = (
  _patternId: string,
  patternTitle: string,
  fragments: { componentId: string; html: string }[],
  basePath: string,
  sharedArtifacts: SharedArtifactPresence,
  componentArtifacts: Map<string, ComponentArtifactPresence>
): string => {
  const cssHrefs = new Set<string>();
  const bodyParts: string[] = [];
  const clientArtifactHrefs = new Set<string>();

  if (sharedArtifacts.mainCss) {
    cssHrefs.add(buildArtifactUrl(SHARED_MAIN_CSS_ARTIFACT_PATH, basePath));
  }
  cssHrefs.add(`${basePath}/assets/css/preview.css`);

  // Canonical URL of the shared global script; used to strip any per-fragment reference so the
  // global script is emitted (and executed) exactly once for the whole composed page.
  const globalScriptUrl = buildArtifactUrl(SHARED_MAIN_JS_ARTIFACT_PATH, basePath);

  const seenComponents = new Set<string>();

  for (let i = 0; i < fragments.length; i++) {
    const { componentId, html } = fragments[i];

    if (!seenComponents.has(componentId)) {
      seenComponents.add(componentId);
      // Reference a component's stylesheet only when it actually exists, so a pattern never requests
      // an absent optional artifact for a component that declares no styles.
      if (componentArtifacts.get(componentId)?.css) {
        cssHrefs.add(buildArtifactUrl(`component/${componentId}.css`, basePath));
      }
    }

    const doc = parse(html);
    const suffix = `_p${i}`;
    const namespacedRootId = `root${suffix}`;
    const namespacedPropsId = `__APP_PROPS__${suffix}`;

    // -- Extract props JSON (React SSR) ------------------------------------
    const propsScript = doc.querySelector('#__APP_PROPS__');
    let propsContent: string | null = null;
    if (propsScript) {
      propsContent = propsScript.textContent || '{}';
      propsScript.remove();
    }

    // -- Drop the fragment's own client-artifact reference -----------------
    // The bundle is referenced once per component for the whole page (below); a fragment must not
    // carry its standalone-preview script tag into the composed document.
    for (const script of doc.querySelectorAll('script[type="module"]')) {
      script.remove();
    }

    // -- Drop the fragment's own global-script reference -------------------
    // Static (Handlebars) fragments render the global `component/main.js` tag inside their body; left
    // in place it would be inlined per fragment and run the global side effects multiple times. The
    // page references the global script exactly once (below).
    for (const script of doc.querySelectorAll('script')) {
      if (script.getAttribute('src') === globalScriptUrl) {
        script.remove();
      }
    }

    // -- Namespace the root element (React SSR) ----------------------------
    // A React fragment exposes its mount point to the component bundle via stable data attributes.
    const rootEl = doc.querySelector('#root');
    const isReactFragment = !!rootEl && propsContent !== null;
    if (rootEl) {
      rootEl.setAttribute('id', namespacedRootId);
      if (isReactFragment) {
        rootEl.setAttribute('data-handoff-component', componentId);
        rootEl.setAttribute('data-handoff-props', namespacedPropsId);
        clientArtifactHrefs.add(buildArtifactUrl(`component/${componentId}.client.js`, basePath));
      }
    }

    // -- Extract body content ----------------------------------------------
    const bodyEl = doc.querySelector('body');
    const bodyContent = bodyEl
      ? bodyEl.innerHTML.trim()
      : rootEl
        ? rootEl.outerHTML
        : doc.innerHTML || '';

    const propsScriptTag =
      propsContent !== null
        ? `      <script id="${namespacedPropsId}" type="application/json">${propsContent}</script>\n`
        : '';

    bodyParts.push(
      `    <div class="handoff-pattern-block" data-component="${componentId}" data-fragment="${i}">\n` +
      propsScriptTag +
      `      ${bodyContent}\n` +
      `    </div>`
    );
  }

  const linkTags = Array.from(cssHrefs)
    .map((href) => `    <link rel="stylesheet" href="${href}" />`)
    .join('\n');

  // The global script is referenced once for the whole page (deduplicated across fragments) and
  // placed before the per-component client bundles so its side effects run first and exactly once.
  const globalScriptTag = sharedArtifacts.mainJs
    ? `    <script src="${buildArtifactUrl(SHARED_MAIN_JS_ARTIFACT_PATH, basePath)}"></script>`
    : '';

  const clientScriptTags = Array.from(clientArtifactHrefs)
    .map((href) => `    <script type="module" src="${href}"></script>`)
    .join('\n');

  const scriptTags = [globalScriptTag, clientScriptTags].filter(Boolean).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
${linkTags}
    <title>${escape(patternTitle)}</title>
  </head>
  <body>
${bodyParts.join('\n')}
${scriptTags}
  </body>
</html>`;
};
