import { Types as CoreTypes } from 'handoff-core';
import path from 'path';
import { PluginOption, normalizePath } from 'vite';
import Handoff from '../..';
import { Logger } from '../../utils/logger';
import { TransformComponentTokensResult } from '../preview/types';
import { AngularComponentInfo, loadAngularToolchain, readAngularComponent, writeCompilationTsconfig } from '../utils/angular';
import { resolveModule } from '../utils/build';
import { CLIENT_RENDER_RUNTIME_SOURCE } from '../utils/render-shell';
import { tsconfigPathsPlugin } from '../utils/tsconfig-paths';
import { generateAngularUsageSnippet, parseSelector } from '../utils/usage';
import { clientRenderPlugin } from './client-previews';

/**
 * The client artifact. One application per document renders every mount point of the component.
 *
 * A render with the same inputs as the last one updates the component in place, so it keeps its state.
 * A render that drops an input creates a new component, because only a new component returns an
 * input to its default. Args that name no input are ignored.
 */
const generateClientSource = (componentId: string, entry: string, info: AngularComponentInfo, useZone: boolean): string => {
  const { tag, attributes } = parseSelector(info.selector);
  const inputs = Object.fromEntries(
    info.inputs.flatMap(({ key, binding }) => [
      [binding, binding],
      [key, binding],
    ])
  );
  const classKeys = info.inputs.map(({ key }) => key);
  const changeDetection = useZone ? 'provideZoneChangeDetection({ eventCoalescing: true })' : `${info.zonelessProvider}()`;
  const importClause = info.exportName === 'default' ? 'Component' : `{ ${info.exportName} as Component }`;
  return `
  ${useZone ? "import 'zone.js';" : ''}
  import { NgZone, createComponent, ${useZone ? 'provideZoneChangeDetection' : info.zonelessProvider} } from '@angular/core';
  import { createApplication } from '@angular/platform-browser';
  import ${importClause} from '${normalizePath(entry)}';
  ${CLIENT_RENDER_RUNTIME_SOURCE}

  const INPUTS = ${JSON.stringify(inputs)};
  const CLASS_KEYS = new Set(${JSON.stringify(classKeys)});
  const HOST_ATTRIBUTES = ${JSON.stringify(attributes)};

  // A production build reports only a code, such as NG0950, so the message links to its explanation.
  const explain = (error) => {
    const code = error?.message?.match(/^NG0\\d+/)?.[0];
    return code ? new Error(error.message + ' (https://angular.dev/errors/' + code + ')') : error;
  };

  const mount = (app, container) => {
    const zone = app.injector.get(NgZone);
    let ref = null;
    let keys = [];
    const create = () => {
      ref?.destroy();
      const host = document.createElement(${JSON.stringify(tag)});
      for (const [name, value] of HOST_ATTRIBUTES) host.setAttribute(name, value);
      container.replaceChildren(host);
      ref = createComponent(Component, { environmentInjector: app.injector, hostElement: host });
      app.attachView(ref.hostView);
    };
    // Inside the zone, so that with zone.js the component's events run change detection.
    return (args) =>
      zone.run(() => {
        try {
          // An input given by both names takes the value of its class property name.
          const names = Object.keys(args).filter((name) => Object.prototype.hasOwnProperty.call(INPUTS, name));
          const values = new Map();
          for (const name of names) if (!CLASS_KEYS.has(name)) values.set(INPUTS[name], args[name]);
          for (const name of names) if (CLASS_KEYS.has(name)) values.set(INPUTS[name], args[name]);
          const next = Array.from(values.keys());
          if (!ref || keys.some((binding) => !values.has(binding))) create();
          keys = next;
          for (const [binding, value] of values) ref.setInput(binding, value);
          ref.changeDetectorRef.detectChanges();
        } catch (error) {
          try {
            ref?.destroy();
          } catch (_) {}
          ref = null;
          throw explain(error);
        }
      });
  };

  createApplication({ providers: [${changeDetection}] }).then(
    (app) => mountPreviews(${JSON.stringify(componentId)}, (container) => mount(app, container)),
    (error) => reportRenderError(explain(error))
  );
`;
};

/** Zone-based change detection when the workspace has zone.js, so a component that relies on it updates. */
const hasZoneJs = (entry: string, workingPath: string): boolean => {
  try {
    resolveModule('zone.js', [path.dirname(entry), workingPath]);
    return true;
  } catch {
    return false;
  }
};

const createAngularPlugins = async (
  componentData: TransformComponentTokensResult,
  documentationComponents: CoreTypes.IDocumentationObject['components'] | undefined,
  handoff: Handoff
): Promise<PluginOption[]> => {
  const entry = path.resolve(componentData.entries.template);
  const toolchain = await loadAngularToolchain(handoff);
  const tsconfig = writeCompilationTsconfig(handoff, componentData.id, entry);
  const info = readAngularComponent(toolchain, entry, tsconfig, componentData.componentExport);
  const useZone = hasZoneJs(entry, handoff.workingPath);
  Logger.debug(`Angular component "${info.exportName}" (${info.selector}) for ${componentData.id}${useZone ? ' with zone.js' : ''}`);
  return [
    tsconfigPathsPlugin(toolchain.ts, toolchain.compilerCli.readConfiguration(tsconfig).options, path.dirname(tsconfig)),
    // Type checking reports template errors with their location, as `ng build` does.
    ...toolchain.vitePlugin({ tsconfig, workspaceRoot: handoff.workingPath, disableTypeChecking: false }),
    clientRenderPlugin(componentData, documentationComponents, handoff, {
      format: 'angular',
      entry,
      clientSource: generateClientSource(componentData.id, entry, info, useZone),
      properties: info.properties,
      usage: (previewValues) =>
        generateAngularUsageSnippet({ selector: info.selector, inputs: info.inputs, properties: info.properties, previewValues }),
      watchFiles: info.resourceFiles,
    }),
  ];
};

/**
 * Compiles the component ahead of time with the workspace's Angular, bundles it into the component's
 * client artifact, and emits its preview documents and custom preview render shell. Vite resolves the
 * returned promise, so the Angular tooling loads only when an Angular component builds.
 */
export function angularRenderPlugins(
  componentData: TransformComponentTokensResult,
  documentationComponents: CoreTypes.IDocumentationObject['components'] | undefined,
  handoff: Handoff
): PluginOption[] {
  return [createAngularPlugins(componentData, documentationComponents, handoff)];
}
