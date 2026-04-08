import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

import Handlebars from 'handlebars';
import { PlaygroundComponent, SelectedPlaygroundComponent } from './types';

/**
 * Register all Handlebars helpers needed by component templates.
 * Mirrors the build-pipeline's registerHandlebarsHelpers (from
 * src/transformers/utils/handlebars.ts) but without Node-only deps.
 * Called before every Handlebars compile to guarantee parity.
 */
function registerPlaygroundHelpers() {
  Handlebars.registerHelper('field', function (this: any, _field: string, options: Handlebars.HelperOptions) {
    return options.fn(this);
  });

  Handlebars.registerHelper('eq', function (a: any, b: any) {
    return a === b;
  });

  Handlebars.registerHelper('ne', function (a: any, b: any) {
    return a !== b;
  });

  Handlebars.registerHelper('and', function (this: any, ...args: any[]) {
    const options = args.pop();
    return args.every(Boolean) ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper('or', function (this: any, ...args: any[]) {
    const options = args.pop();
    return args.some(Boolean) ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper('not', function (value: any) {
    return !value;
  });

  Handlebars.registerHelper('gt', function (a: any, b: any) { return a > b; });
  Handlebars.registerHelper('gte', function (a: any, b: any) { return a >= b; });
  Handlebars.registerHelper('lt', function (a: any, b: any) { return a < b; });
  Handlebars.registerHelper('lte', function (a: any, b: any) { return a <= b; });

  Handlebars.registerHelper('concat', function (...args: any[]) {
    args.pop(); // remove Handlebars options
    return args.join('');
  });

  Handlebars.registerHelper('json', function (context: any) {
    return JSON.stringify(context);
  });

  Handlebars.registerHelper('default', function (value: any, fallback: any) {
    return value != null && value !== '' ? value : fallback;
  });

  Handlebars.registerHelper('capitalize', function (str: any) {
    if (typeof str !== 'string') return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  Handlebars.registerHelper('lowercase', function (str: any) {
    return typeof str === 'string' ? str.toLowerCase() : str;
  });

  Handlebars.registerHelper('uppercase', function (str: any) {
    return typeof str === 'string' ? str.toUpperCase() : str;
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
  registerPlaygroundHelpers();
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

function escapeAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const BLOCK_CONTROLS_CSS = `
.playground-block{position:relative}
.playground-block::after{content:'';position:absolute;inset:0;pointer-events:none;border:2px solid transparent;transition:border-color .15s;z-index:9998}
.playground-block:hover::after{border-color:rgba(59,130,246,.45)}
.playground-block-toolbar{position:absolute;top:8px;left:8px;display:flex;align-items:center;gap:4px;opacity:0;transition:opacity .15s;z-index:9999}
.playground-block:hover .playground-block-toolbar{opacity:1}
.playground-block-title{background:rgba(59,130,246,.9);color:#fff;font-size:11px;font-weight:500;padding:3px 8px;border-radius:4px;line-height:1.3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;white-space:nowrap}
.playground-block-btn{background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:4px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;box-shadow:0 1px 3px rgba(0,0,0,.08);transition:background .1s,border-color .1s;color:#374151}
.playground-block-btn:hover{background:#f3f4f6}
.playground-block-btn.delete:hover{background:#fef2f2;border-color:#fca5a5;color:#ef4444}
`;

function getBlockControlsScript(): string {
  const editSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>';
  const trashSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>';

  return `
(function(){
  document.querySelectorAll('.playground-block').forEach(function(block){
    var id=block.getAttribute('data-block-id');
    var title=block.getAttribute('data-block-title');
    var tb=document.createElement('div');
    tb.className='playground-block-toolbar';
    tb.innerHTML='<span class="playground-block-title">'+title+'</span>'
      +'<button class="playground-block-btn edit" title="Edit">${editSvg}</button>'
      +'<button class="playground-block-btn delete" title="Remove">${trashSvg}</button>';
    block.insertBefore(tb,block.firstChild);
    tb.addEventListener('click',function(e){
      var btn=e.target.closest('.playground-block-btn');
      if(!btn)return;
      e.stopPropagation();e.preventDefault();
      var action=btn.classList.contains('edit')?'edit':'delete';
      window.parent.postMessage({type:'playground-block-action',action:action,blockId:id},'*');
    });
  });
})();
`;
}

export async function constructComponentPreview(
  components: SelectedPlaygroundComponent[],
  basePath: string = '',
  options?: { injectBlockControls?: boolean }
): Promise<string> {
  let html = '';
  const cssOverrides = new Set<string>();
  const injectControls = options?.injectBlockControls ?? false;

  for (const component of components) {
    if (component.options?.preview?.css) {
      cssOverrides.add(component.options.preview.css);
    }

    let blockHtml: string;
    if (component.format === 'react') {
      blockHtml = component.html || '';
    } else if (component.rendered) {
      blockHtml = component.rendered;
    } else {
      blockHtml = component.html || '';
    }

    if (injectControls && component.uniqueId) {
      html += `<div class="playground-block" data-block-id="${escapeAttr(component.uniqueId)}" data-block-title="${escapeAttr(component.title)}">${blockHtml}</div>`;
    } else {
      html += blockHtml;
    }
  }

  const cssOverrideLinks = Array.from(cssOverrides)
    .map((href) => `\n      <link rel="stylesheet" href="${href}" />`)
    .join('');

  const controlsStyle = injectControls ? `<style>${BLOCK_CONTROLS_CSS}</style>` : '';
  const controlsScript = injectControls ? `<script>${getBlockControlsScript()}</script>` : '';

  return `<html>
    <head>
      <link rel="stylesheet" href="${basePath}/api/component/main.css" />${cssOverrideLinks}
      ${controlsStyle}
    </head>
    <body>
      ${html}
    </body>
    <script src="${basePath}/api/component/main.js"></script>
    ${controlsScript}
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
