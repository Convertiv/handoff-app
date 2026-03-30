import escape from 'lodash/escape';
import { parse } from 'node-html-parser';

/**
 * Composes multiple component preview HTML documents into a single-page HTML.
 *
 * Each component preview may be a React SSR document (with hydration scripts
 * and a `#root` / `#__APP_PROPS__` pair) or a static Handlebars document.
 *
 * This function namespaces the element ids per-fragment so multiple React
 * components can coexist and hydrate independently on the same page.
 *
 * Each hydration bundle gets its own `<script type="module">` tag for full
 * module-level isolation. This is critical because esbuild bundles React
 * into each script using module-scoped `var` declarations, and `hydrateRoot`
 * is asynchronous — sharing a single module scope would cause later bundles
 * to overwrite earlier React instances before hydration completes.
 */
export const composePatternHtml = (
  _patternId: string,
  patternTitle: string,
  fragments: { componentId: string; html: string }[],
  basePath: string
): string => {
  const cssHrefs = new Set<string>();
  const bodyParts: string[] = [];
  const scriptTags: string[] = [];

  cssHrefs.add(`${basePath}/api/component/main.css`);
  cssHrefs.add(`${basePath}/assets/css/preview.css`);

  const seenComponents = new Set<string>();

  for (let i = 0; i < fragments.length; i++) {
    const { componentId, html } = fragments[i];

    if (!seenComponents.has(componentId)) {
      seenComponents.add(componentId);
      cssHrefs.add(`${basePath}/api/component/${componentId}.css`);
    }

    const doc = parse(html);
    const suffix = `_p${i}`;
    const namespacedRootId = `root${suffix}`;
    const namespacedPropsId = `__APP_PROPS__${suffix}`;

    // -- Extract props JSON (React SSR) ------------------------------------
    const propsScript = doc.querySelector('#__APP_PROPS__');
    let propsContent = '{}';
    if (propsScript) {
      propsContent = propsScript.textContent || '{}';
      propsScript.remove();
    }

    // -- Extract and rewrite hydration scripts (React SSR) -----------------
    // Each script becomes its own <script type="module"> for full isolation.
    const moduleScripts = doc.querySelectorAll('script[type="module"]');
    for (const script of moduleScripts) {
      let code = script.textContent || '';
      if (code.trim()) {
        code = code
          .replace(/__APP_PROPS__/g, namespacedPropsId)
          .replace(/getElementById\(\s*["']root["']\s*\)/g, `getElementById("${namespacedRootId}")`);
        scriptTags.push(`    <script type="module">\n${code}\n    </script>`);
      }
      script.remove();
    }

    // -- Namespace the root element (React SSR) ----------------------------
    const rootEl = doc.querySelector('#root');
    if (rootEl) {
      rootEl.setAttribute('id', namespacedRootId);
    }

    // -- Extract body content ----------------------------------------------
    const bodyEl = doc.querySelector('body');
    const bodyContent = bodyEl
      ? bodyEl.innerHTML.trim()
      : rootEl
        ? rootEl.outerHTML
        : doc.innerHTML || '';

    bodyParts.push(
      `    <div class="handoff-pattern-block" data-component="${componentId}" data-fragment="${i}">\n` +
      `      <script id="${namespacedPropsId}" type="application/json">${propsContent}</script>\n` +
      `      ${bodyContent}\n` +
      `    </div>`
    );
  }

  const linkTags = Array.from(cssHrefs)
    .map((href) => `    <link rel="stylesheet" href="${href}" />`)
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
${scriptTags.join('\n')}
  </body>
</html>`;
};
