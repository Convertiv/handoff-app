import escape from 'lodash/escape';
import { parse } from 'node-html-parser';
import { buildArtifactUrl } from '../../../artifacts/url';

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
 * and references each unique component's client artifact exactly once. (Shared `component/main.js`
 * dedup/once-execution ordering is handled separately by the global-artifact work.)
 */
export const composePatternHtml = (
  _patternId: string,
  patternTitle: string,
  fragments: { componentId: string; html: string }[],
  basePath: string
): string => {
  const cssHrefs = new Set<string>();
  const bodyParts: string[] = [];
  const clientArtifactHrefs = new Set<string>();

  cssHrefs.add(buildArtifactUrl('component/main.css', basePath));
  cssHrefs.add(`${basePath}/assets/css/preview.css`);

  const seenComponents = new Set<string>();

  for (let i = 0; i < fragments.length; i++) {
    const { componentId, html } = fragments[i];

    if (!seenComponents.has(componentId)) {
      seenComponents.add(componentId);
      cssHrefs.add(buildArtifactUrl(`component/${componentId}.css`, basePath));
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

  const scriptTags = Array.from(clientArtifactHrefs)
    .map((href) => `    <script type="module" src="${href}"></script>`)
    .join('\n');

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
