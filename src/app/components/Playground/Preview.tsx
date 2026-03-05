import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

import Handlebars from 'handlebars';
import { PlaygroundComponent } from './types';

Handlebars.registerHelper('eq', function (a: any, b: any) {
  return a === b;
});

/**
 * Register the `field` block helper used in Handlebars component templates.
 * In the Playground we never inject inspect wrappers, so it simply passes
 * through the block content.
 */
function registerFieldHelper() {
  Handlebars.registerHelper('field', function (this: any, _field: string, options: Handlebars.HelperOptions) {
    return options.fn(this);
  });
}

/**
 * Build the context object that Handlebars templates expect.
 * Mirrors `createHandlebarsContext` from the build-time pipeline but
 * without Node-only dependencies.
 */
function createPlaygroundHandlebarsContext(
  component: PlaygroundComponent,
  data: any,
  basePath: string
) {
  const previewCssLink = component.options?.preview?.css
    ? `\n<link rel="stylesheet" href="${component.options.preview.css}">`
    : '';
  return {
    style:
      `<link rel="stylesheet" href="${basePath}/api/component/main.css">` +
      `<link rel="stylesheet" href="${basePath}/api/component/${component.id}.css">\n` +
      `<link rel="stylesheet" href="${basePath}/assets/css/preview.css">` +
      previewCssLink,
    script:
      `<script src="${basePath}/api/component/${component.id}.js"></script>\n` +
      `<script src="${basePath}/assets/js/preview.js"></script>` +
      `<script>var fields = ${JSON.stringify(component.properties || {})};</script>`,
    properties: data || component.data || {},
    fields: component.properties || {},
    title: component.title,
  };
}

/**
 * Render a Handlebars component with the build-time-equivalent context.
 */
export function renderHandlebarsPreview(
  component: PlaygroundComponent,
  data: any = null,
  basePath: string = ''
): string {
  registerFieldHelper();
  const context = createPlaygroundHandlebarsContext(component, data, basePath);
  const template = Handlebars.compile(component.code);
  return template(context);
}

/**
 * Construct an iframe HTML document that loads a React/CSF component module
 * and renders it with the given props. The module is served from
 * `/api/component/{id}.module.js` and exposes `render(container, props)`
 * and `update(props)` functions. The iframe listens for `postMessage`
 * events to re-render with new props without reloading the module.
 */
export function renderReactPreview(
  component: PlaygroundComponent,
  data: any = null,
  basePath: string = ''
): string {
  const props = JSON.stringify(data || component.data || {});
  const previewCssLink = component.options?.preview?.css
    ? `\n    <link rel="stylesheet" href="${component.options.preview.css}" />`
    : '';
  return `<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="${basePath}/api/component/main.css" />
    <link rel="stylesheet" href="${basePath}/api/component/${component.id}.css" />
    <link rel="stylesheet" href="${basePath}/assets/css/preview.css" />${previewCssLink}
  </head>
  <body>
    <div id="root"></div>
    <script id="__PROPS__" type="application/json">${props}</script>
    <script type="module">
      import { render, update } from '${basePath}/api/component/${component.id}.module.js';

      const container = document.getElementById('root');
      const initialProps = JSON.parse(document.getElementById('__PROPS__').textContent);
      render(container, initialProps);

      window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'update-props') {
          update(event.data.props);
        }
      });
    </script>
  </body>
</html>`;
}

/**
 * Format-aware render dispatcher. Returns rendered HTML for the component.
 */
export async function renderPreview(
  component: PlaygroundComponent,
  data: any = null,
  basePath: string = ''
): Promise<string> {
  if (component.format === 'react') {
    return renderReactPreview(component, data, basePath);
  }
  return renderHandlebarsPreview(component, data, basePath);
}

export function previewRenderedHtml(html: string, basePath: string = ''): string {
  return `<html>
  <head>
    <link rel="stylesheet" href="${basePath}/api/component/main.css" />
  </head>
  <body>
    ${html}
  </body>
  <script src="${basePath}/api/component/main.js"></script>
</html>`;
}

export async function constructComponentPreview(components: PlaygroundComponent[], basePath: string = ''): Promise<string> {
  let html = '';
  const cssOverrides = new Set<string>();
  for (const component of components) {
    if (component.options?.preview?.css) {
      cssOverrides.add(component.options.preview.css);
    }
    if (component.format === 'react') {
      // React/CSF: always use the pre-built HTML fragment (SSR output).
      // component.rendered for React is a full document with module scripts
      // and can't be concatenated into a composite.
      html += component.html || '';
    } else if (component.rendered) {
      html += component.rendered;
    } else {
      html += component.html;
    }
  }
  const cssOverrideLinks = Array.from(cssOverrides).map((href) => `\n      <link rel="stylesheet" href="${href}" />`).join('');
  return `<html>
    <head>
      <link rel="stylesheet" href="${basePath}/api/component/main.css" />${cssOverrideLinks}
    </head>
    <body>
      ${html}
    </body>
    <script src="${basePath}/api/component/main.js"></script>
  </html>`;
}

interface PreviewProps {
  html: string;
  className?: string;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
}

export default function Preview({ html, className, iframeRef: externalRef }: PreviewProps) {
  const internalRef = useRef<HTMLIFrameElement>(null);
  const ref = externalRef || internalRef;

  useEffect(() => {
    if (ref.current) {
      const iframeDoc = ref.current.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();
      }
    }
  }, [html, ref]);

  return <iframe ref={ref} className={cn('h-full w-full', className)} title="Component Preview" sandbox="allow-scripts allow-same-origin" />;
}
