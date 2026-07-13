/**
 * Connected-workspace publish orchestration.
 *
 * `publish <component|pattern|page> <id>` prepares one entity and uploads its record, source files,
 * applicable rendered artifacts, and build metadata through the shared registry client.
 *
 * The build is targeted: a component builds the global artifacts + that component; a pattern builds
 * the global artifacts + the components it composes + the pattern itself. This is the smallest build
 * that still guarantees the entity's artifacts (and the shared artifacts they reference) are current.
 */

import Handoff from '../../index';
import { buildMainCss } from '../../transformers/preview/component/css';
import { buildMainJS } from '../../transformers/preview/component/javascript';
import processComponents from '../../transformers/preview/component/builder';
import { processPatterns } from '../../transformers/preview/pattern/builder';
import { Logger } from '../../utils/logger';
import { createRegistryClient, RegistryClientError } from '../client';
import { resolveRegistryConnection } from '../connection';
import type { TransferEntityKind } from '../transfer';
import { describeUploadFailure } from './errors';
import { assertRequiredArtifactsPresent, buildPublishPackage, PublishPackageError } from './package';

/** A connected-workspace configuration or precondition failure surfaced to the CLI. */
export class PublishError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublishError';
  }
}

/**
 * Ensure the workspace is a connected workspace able to publish: workspace runtime mode (registry
 * hosts do not publish) and a resolved registry URL + access token. Throws an actionable
 * {@link PublishError} naming the exact misconfiguration.
 */
export const resolveConnectionOrThrow = (handoff: Handoff) => {
  const mode = handoff.config?.runtime?.mode ?? 'workspace';
  if (mode !== 'workspace') {
    throw new PublishError(
      `publish is only available from a connected workspace (runtime.mode: "workspace"); this project is "${mode}". ` +
        'A registry host stores and serves what was published to it; it does not publish.'
    );
  }

  const connection = resolveRegistryConnection(handoff.config);
  if (!connection.url) {
    throw new PublishError(
      `No registry URL is configured. Set runtime.registryConnection.url, or the "${connection.urlEnv}" environment variable, ` +
        'to the base URL of the registry to publish to.'
    );
  }
  if (!connection.accessToken) {
    throw new PublishError(
      `No registry access token is configured. Set the "${connection.accessTokenEnv}" environment variable to the ` +
        "registry's bearer token to authorize publishing."
    );
  }
  return connection;
};

/** Run the smallest build that guarantees the selected entity's artifacts are current. */
const runTargetedBuild = async (handoff: Handoff, kind: TransferEntityKind, id: string): Promise<void> => {
  // Pages carry no rendered artifacts (raw markdown is rendered at runtime), so there is nothing to
  // build — the package is assembled directly from the discovered page record + its `.md`.
  if (kind === 'page') {
    if (!handoff.runtimeConfig?.entries?.pages?.[id]) {
      throw new PublishPackageError(`Page "${id}" is not declared in this workspace.`);
    }
    return;
  }

  // Global artifacts first so generated HTML references `component/main.{css,js}` / `shared.css` only
  // when they actually exist.
  await buildMainJS(handoff);
  await buildMainCss(handoff);

  if (kind === 'component') {
    if (!handoff.runtimeConfig?.entries?.components?.[id]) {
      throw new PublishPackageError(`Component "${id}" is not declared in this workspace.`);
    }
    await processComponents(handoff, id);
    return;
  }

  const pattern = handoff.runtimeConfig?.entries?.patterns?.[id];
  if (!pattern) {
    throw new PublishPackageError(`Pattern "${id}" is not declared in this workspace.`);
  }
  // A pattern composes pre-built component preview HTML, so build the components it references first,
  // then compose just this pattern.
  const referencedComponentIds = new Set(pattern.components.map((ref) => ref.id));
  for (const componentId of Array.from(referencedComponentIds)) {
    if (handoff.runtimeConfig?.entries?.components?.[componentId]) {
      await processComponents(handoff, componentId);
    }
  }
  await processPatterns(handoff, { onlyPatternIds: new Set([id]) });
};

/**
 * Publish a single component, pattern, or page from a connected workspace. Components and patterns
 * receive a targeted build, while pages are packaged directly from their source.
 */
export const publishEntity = async (handoff: Handoff, kind: TransferEntityKind, id: string): Promise<void> => {
  const connection = resolveConnectionOrThrow(handoff);

  Logger.info(kind === 'page' ? `Preparing page "${id}" for publish…` : `Building ${kind} "${id}" for publish…`);
  await runTargetedBuild(handoff, kind, id);

  const pkg = await buildPublishPackage(handoff, kind, id);
  assertRequiredArtifactsPresent(pkg);

  Logger.info(
    `Uploading ${kind} "${id}" to ${connection.url} (${pkg.artifacts.length} artifact(s), ${pkg.files.length} source file(s))…`
  );
  const client = createRegistryClient({ baseUrl: connection.url, accessToken: connection.accessToken });
  try {
    await client.publish(kind, id, pkg);
  } catch (error) {
    if (error instanceof RegistryClientError) {
      throw new PublishError(describeUploadFailure(error, connection.url, 'package'));
    }
    throw error;
  }

  Logger.success(`Published ${kind} "${id}" to the registry.`);
};
