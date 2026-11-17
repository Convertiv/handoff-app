import { Types as CoreTypes } from 'handoff-core';
import path from 'path';
import { PluginOption, normalizePath } from 'vite';
import Handoff from '../..';
import { Logger } from '../../utils/logger';
import { TransformComponentTokensResult } from '../preview/types';
import { CLIENT_RENDER_RUNTIME_SOURCE } from '../utils/render-shell';
import { tsconfigPathsPlugin } from '../utils/tsconfig-paths';
import { generateVueUsageSnippet } from '../utils/usage';
import { findVueTsconfig, loadVueToolchain, readVueComponent } from '../utils/vue';
import { clientRenderPlugin } from './client-previews';

/**
 * The client artifact. Each mount point gets its own application, whose root renders the component
 * with reactive props.
 *
 * - A render updates the args that changed in place, so the component keeps its state. A render that
 *   drops a prop creates a new application, because only a new component returns a prop to its default.
 * - The accepted props and models come from the compiled component, not from the build metadata, so an
 *   arg reaches the component even when its metadata is incomplete. Other args are ignored.
 * - The root binds each model prop like `v-model`, so the component can change its own value.
 * - An error during a render throws to the runtime; an error in a later update is reported through it.
 */
const generateClientSource = (componentId: string, entry: string): string => `
  import { createApp, h, shallowReactive } from 'vue';
  import Component from '${normalizePath(entry)}';
  ${CLIENT_RENDER_RUNTIME_SOURCE}

  const camelize = (name) => name.replace(/-([a-z0-9])/g, (_, letter) => letter.toUpperCase());
  const optionKeys = (option) => (Array.isArray(option) ? option : option && typeof option === 'object' ? Object.keys(option) : []);
  // The props and emits that Vue accepts for the component, collected as Vue normalizes its options:
  // a class component through __vccOpts, then extends, mixins, and the component's own options.
  const collectOptions = (component, seen = new Set()) => {
    const options = component && component.__vccOpts ? component.__vccOpts : component;
    if (!options || seen.has(options)) return { props: [], emits: [] };
    seen.add(options);
    const props = [];
    const emits = [];
    if (typeof options !== 'function') {
      for (const parent of [options.extends, ...(options.mixins || [])]) {
        const inherited = collectOptions(parent, seen);
        props.push(...inherited.props);
        emits.push(...inherited.emits);
      }
    }
    props.push(...optionKeys(options.props).map(camelize));
    emits.push(...optionKeys(options.emits).map(camelize));
    return { props, emits };
  };
  const OPTIONS = collectOptions(Component);
  const PROPS = new Set(OPTIONS.props);
  const MODELS = Array.from(PROPS).filter((name) => OPTIONS.emits.includes('update:' + name));
  const same = (first, second) => first === second || JSON.stringify(first) === JSON.stringify(second);

  const mount = (container) => {
    let app = null;
    let props = null;
    let lastArgs = new Map();
    let failed = false;
    let rendering = false;
    let renderError = null;
    const report = (error) => (container.id === 'root' ? reportRenderError(error) : console.error(error));
    const create = (values) => {
      try {
        app?.unmount();
      } catch (_) {}
      failed = false;
      props = shallowReactive(Object.fromEntries(values));
      const listeners = Object.fromEntries(MODELS.map((name) => ['onUpdate:' + name, (value) => (props[name] = value)]));
      app = createApp({ name: 'HandoffPreview', render: () => h(Component, { ...props, ...listeners }) });
      app.config.errorHandler = (error) => {
        failed = true;
        if (rendering) renderError = renderError ?? error;
        else report(error);
      };
      app.mount(container);
    };
    return (args) => {
      const values = new Map();
      for (const name of Object.keys(args)) {
        const key = PROPS.has(name) ? name : camelize(name);
        if (PROPS.has(key)) values.set(key, args[name]);
      }
      rendering = true;
      renderError = null;
      try {
        if (!app || failed || Array.from(lastArgs.keys()).some((key) => !values.has(key))) create(values);
        // An unchanged arg is not set again, so a value the component changed through its model stays.
        else for (const [key, value] of values) if (!lastArgs.has(key) || !same(lastArgs.get(key), value)) props[key] = value;
      } finally {
        rendering = false;
      }
      lastArgs = values;
      if (renderError) throw renderError;
    };
  };

  mountPreviews(${JSON.stringify(componentId)}, (container) => mount(container));
`;

const createVuePlugins = async (
  componentData: TransformComponentTokensResult,
  documentationComponents: CoreTypes.IDocumentationObject['components'] | undefined,
  handoff: Handoff
): Promise<PluginOption[]> => {
  const entry = path.resolve(componentData.entries.template);
  const toolchain = await loadVueToolchain(handoff);
  const tsconfig = findVueTsconfig(toolchain.ts, handoff.workingPath, entry);
  const info = readVueComponent(toolchain, handoff.workingPath, entry, tsconfig);
  Logger.debug(`Vue ${toolchain.version} component <${info.tag}> for ${componentData.id}${tsconfig.file ? ` with ${tsconfig.file}` : ''}`);
  return [
    ...(tsconfig.file ? [tsconfigPathsPlugin(toolchain.ts, tsconfig.options, path.dirname(tsconfig.file))] : []),
    // Like `vite build`, this compiles templates and fails on their syntax errors, but does not type-check.
    toolchain.vitePlugin(),
    clientRenderPlugin(componentData, documentationComponents, handoff, {
      format: 'vue',
      entry,
      clientSource: generateClientSource(componentData.id, entry),
      properties: info.properties,
      usage: (previewValues) => generateVueUsageSnippet({ tag: info.tag, props: info.props, properties: info.properties, previewValues }),
      watchFiles: info.watchFiles,
    }),
  ];
};

/**
 * Compiles the single-file component with `@vitejs/plugin-vue` and the workspace's Vue, bundles it into
 * the component's client artifact, and emits its preview documents and custom preview render shell.
 * Vite resolves the returned promise, so the Vue tooling loads only when a Vue component builds.
 */
export function vueRenderPlugins(
  componentData: TransformComponentTokensResult,
  documentationComponents: CoreTypes.IDocumentationObject['components'] | undefined,
  handoff: Handoff
): PluginOption[] {
  return [createVuePlugins(componentData, documentationComponents, handoff)];
}
