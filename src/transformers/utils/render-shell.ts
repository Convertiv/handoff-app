import esbuild from 'esbuild';
import { buildArtifactUrl } from '../../artifacts/url';
import { CLIENT_ARTIFACT_SUFFIX, RENDER_PROPS_SCRIPT_ID, RENDER_SHELL_SUFFIX, scriptSafeJson } from '../../custom-previews/shell';
import { Logger } from '../../utils/logger';
import {
  renderComponentStyleLink,
  renderGlobalScriptTag,
  renderSharedStyleLinks,
  type ComponentArtifactPresence,
  type SharedArtifactPresence,
} from '../preview/component/shared-artifacts';
import { DEFAULT_CLIENT_BUILD_CONFIG, createReactResolvePlugin, withStyleLoaders } from './build';

/**
 * Custom preview render shell: renders the component in the browser with any JSON args, with no build.
 *
 * postMessage protocol:
 * - shell → parent `{ type: 'handoff:ready' }` once it listens
 * - parent → shell `{ type: 'handoff:render', args }`
 * - shell → parent `{ type: 'handoff:rendered' }` or `{ type: 'handoff:render-error', message }`
 * - shell → parent `{ type: 'handoff:resize', height }`
 *
 * The shell runs at an opaque origin (see `src/custom-previews/sandbox.ts`), but `location.origin` still names the registry.
 * So the shell talks only to a registry parent. The parent sees origin `'null'`, so it checks `event.source` and sends to `'*'`.
 */

const ROOT_ELEMENT_ID = 'root';

export const renderShellFileName = (componentId: string): string => `${componentId}${RENDER_SHELL_SUFFIX}`;

export const renderShellArtifactPath = (componentId: string): string => `component/${renderShellFileName(componentId)}`;

export const clientArtifactFileName = (componentId: string): string => `${componentId}${CLIENT_ARTIFACT_SUFFIX}`;

export const clientArtifactPath = (componentId: string): string => `component/${clientArtifactFileName(componentId)}`;

export const CLIENT_RENDER_RUNTIME_SOURCE = `
const __handoffNotify = (message) => {
  if (window.parent !== window) window.parent.postMessage(message, window.location.origin);
};

const __handoffShowError = (message) => {
  const root = document.getElementById('${ROOT_ELEMENT_ID}');
  if (root) {
    const box = document.createElement('pre');
    box.setAttribute('data-handoff-render-error', '');
    box.style.cssText = 'margin:0;padding:1rem;color:#b91c1c;font:13px/1.5 monospace;white-space:pre-wrap';
    box.textContent = 'Render error: ' + message;
    root.replaceChildren(box);
  }
};

const reportRenderError = (error) => {
  const message = error && error.message ? error.message : String(error);
  __handoffShowError(message);
  __handoffNotify({ type: 'handoff:render-error', message });
};

const startClientRender = (render) => {
  const run = (args) => {
    try {
      render(args && typeof args === 'object' && !Array.isArray(args) ? args : {});
      __handoffNotify({ type: 'handoff:rendered' });
    } catch (error) {
      reportRenderError(error);
    }
  };
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return;
    if (event.data && event.data.type === 'handoff:render') run(event.data.args);
  });
  if (document.body && typeof ResizeObserver === 'function') {
    new ResizeObserver(() => __handoffNotify({ type: 'handoff:resize', height: document.body.scrollHeight })).observe(document.body);
  }
  let initial = {};
  try {
    initial = JSON.parse(document.getElementById('${RENDER_PROPS_SCRIPT_ID}')?.textContent || '{}') || {};
  } catch (error) {
    reportRenderError(error);
  }
  run(initial);
  __handoffNotify({ type: 'handoff:ready' });
};
`;

/** Needs `React` and `createRoot` in scope. */
export const REACT_CLIENT_RENDER_SOURCE = `
class HandoffRenderBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    const message = error && error.message ? error.message : String(error);
    window.parent !== window && window.parent.postMessage({ type: 'handoff:render-error', message }, window.location.origin);
  }
  render() {
    if (this.state.error) {
      return React.createElement(
        'pre',
        { 'data-handoff-render-error': '', style: { margin: 0, padding: '1rem', color: '#b91c1c', font: '13px/1.5 monospace', whiteSpace: 'pre-wrap' } },
        'Render error: ' + (this.state.error.message || String(this.state.error))
      );
    }
    return this.props.children;
  }
}

const mountClientRender = (elementFor) => {
  const container = document.getElementById('${ROOT_ELEMENT_ID}');
  if (!container || container.getAttribute('data-handoff-render') !== 'client') return;
  const root = createRoot(container);
  let attempt = 0;
  // A new key resets the boundary, so an error clears on the next args.
  startClientRender((args) => root.render(React.createElement(HandoffRenderBoundary, { key: ++attempt }, elementFor(args))));
};
`;

export const renderShellHead = (
  sharedArtifacts: SharedArtifactPresence,
  componentArtifacts: ComponentArtifactPresence,
  componentId: string
): string => {
  const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';
  return [
    renderSharedStyleLinks(sharedArtifacts, basePath),
    renderComponentStyleLink(componentArtifacts, componentId, basePath),
    `<link rel="stylesheet" href="${basePath}/assets/css/preview.css" />`,
    renderGlobalScriptTag(sharedArtifacts, basePath),
  ]
    .filter(Boolean)
    .join('\n    ');
};

export const generateRenderShellDocument = (input: { componentId: string; title: string; head: string }): string => {
  const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';
  const clientUrl = buildArtifactUrl(clientArtifactPath(input.componentId), basePath);
  const loadError = `Failed to load the client artifact (${clientArtifactPath(input.componentId)}). This component cannot render custom previews.`;
  const onError = `window.parent!==window&&window.parent.postMessage({type:'handoff:render-error',message:${JSON.stringify(loadError)}},location.origin);`
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    ${input.head}
    <script id="${RENDER_PROPS_SCRIPT_ID}" type="application/json">${scriptSafeJson({})}</script>
    <script type="module" src="${clientUrl}" onerror="${onError}"></script>
    <title>${input.title.replace(/</g, '&lt;')}</title>
  </head>
  <body>
    <div id="${ROOT_ELEMENT_ID}" data-handoff-render="client"></div>
  </body>
</html>`;
};

export const bundleClientSource = async (
  source: string,
  handoff: { workingPath: string; modulePath: string; config?: any },
  componentId: string,
  resolveDir: string = process.cwd()
): Promise<string | null> => {
  const config: esbuild.BuildOptions = {
    ...DEFAULT_CLIENT_BUILD_CONFIG,
    logLevel: 'silent',
    stdin: { contents: source, resolveDir, loader: 'tsx' },
    plugins: [createReactResolvePlugin(handoff.workingPath, handoff.modulePath)],
  };
  const hooked = handoff.config?.hooks?.clientBuildConfig ? handoff.config.hooks.clientBuildConfig(config) : config;
  try {
    const result = await esbuild.build(withStyleLoaders(hooked));
    if (result.warnings.length > 0) {
      (await esbuild.formatMessages(result.warnings, { kind: 'warning', color: true })).forEach((message) => Logger.warn(message));
    }
    return result.outputFiles[0].text;
  } catch (error: any) {
    Logger.error(`Failed to build the client bundle for ${componentId}`);
    if (error.errors) {
      (await esbuild.formatMessages(error.errors, { kind: 'error', color: true })).forEach((message) => Logger.error(message));
    }
    return null;
  }
};
