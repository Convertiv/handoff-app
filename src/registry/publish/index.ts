/**
 * Connected-workspace publish orchestration.
 *
 * `publish <components|patterns|pages> <id>` prepares one entity and uploads its record, source files,
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
import { createRegistryClient, RegistryClientError, type RegistryClient } from '../client';
import { resolveAuthenticatedRegistryConnection } from '../connection';
import type { EntitySummary, TransferEntityKind } from '../transfer';
import { selectIds } from '../selection';
import { describePublishError, describeUploadFailure } from './errors';
import { assertRequiredArtifactsPresent, buildPublishPackage, PublishPackageError } from './package';

/** A connected-workspace configuration or precondition failure surfaced to the CLI. */
export class PublishError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublishError';
  }
}

/**
 * Ensure this project may publish at all: a registry host stores and serves what was published to it,
 * so only a workspace runtime can be the source. Kept apart from the connection lookup because a dry
 * run still has to be refused on a registry host while needing no URL or token itself.
 */
export const assertPublishableWorkspace = (handoff: Handoff): void => {
  const mode = handoff.config?.runtime?.mode ?? 'workspace';
  if (mode !== 'workspace') {
    throw new PublishError(
      `publish is only available from a connected workspace (runtime.mode: "workspace"); this project is "${mode}". ` +
        'A registry host stores and serves what was published to it; it does not publish.'
    );
  }
};

/**
 * Ensure the workspace is a connected workspace able to publish: workspace runtime mode (registry
 * hosts do not publish) and a resolved registry URL + access token. Throws an actionable
 * {@link PublishError} naming the exact misconfiguration.
 */
export const resolveConnectionOrThrow = async (handoff: Handoff) => {
  assertPublishableWorkspace(handoff);

  const connection = await resolveAuthenticatedRegistryConnection(handoff.config, handoff.workingPath);
  if (!connection.url) {
    throw new PublishError(
      `No registry is configured. Run \`handoff-app login --url <registry-url>\`, set runtime.registryConnection.url, ` +
        `or set the "${connection.urlEnv}" environment variable to the base URL of the registry to publish to.`
    );
  }
  if (!connection.accessToken) {
    throw new PublishError(
      `No registry access token is configured. Run \`handoff-app login --url ${connection.url}\`, or set the ` +
        `"${connection.accessTokenEnv}" environment variable to a user-issued token for CI.`
    );
  }
  return connection;
};

/**
 * How a publish run reaches the registry. `client` is `null` on a dry run: the documented dry run
 * needs no registry URL or token, so it stops at the workspace guard and contacts nothing.
 */
export interface PublishTransport {
  client: RegistryClient | null;
  /** The registry URL, or a placeholder on a dry run. Used only in log lines and error messages. */
  url: string;
}

/**
 * Resolve the transport for a publish run. Shared by the entity, token and asset paths so the dry-run
 * short-circuit lives in one place instead of four call sites.
 */
export const resolveTransport = async (handoff: Handoff): Promise<PublishTransport> => {
  if (handoff.dryRun) {
    assertPublishableWorkspace(handoff);
    return { client: null, url: '(dry run)' };
  }
  const connection = await resolveConnectionOrThrow(handoff);
  return {
    client: createRegistryClient({ baseUrl: connection.url, accessToken: connection.accessToken }),
    url: connection.url,
  };
};

/** Prefix for a per-item progress line: `Published:` normally, `Would publish:` on a dry run. */
export const publishedLabel = (handoff: Handoff): string => (handoff.dryRun ? 'Would publish' : 'Published');

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
  const { client, url } = await resolveTransport(handoff);

  if (!handoff.skipBuild) {
    Logger.info(kind === 'page' ? `Preparing page "${id}" for publish…` : `Building ${kind} "${id}" for publish…`);
    await runTargetedBuild(handoff, kind, id);
  }

  const pkg = await buildPublishPackage(handoff, kind, id);
  assertRequiredArtifactsPresent(pkg);

  const contents = `${pkg.artifacts.length} artifact(s), ${pkg.files.length} source file(s)`;
  if (!client) {
    Logger.info(`Would publish ${kind} "${id}" (${contents}).`);
    Logger.success(`Dry run: ${kind} "${id}" would be published.`);
    return;
  }

  Logger.info(`Uploading ${kind} "${id}" to ${url} (${contents})…`);
  try {
    await client.publish(kind, id, pkg);
  } catch (error) {
    if (error instanceof RegistryClientError) {
      throw new PublishError(describeUploadFailure(error, url, 'package'));
    }
    throw error;
  }

  Logger.success(`Published ${kind} "${id}" to the registry.`);
};

/** The published-content hash a bulk publish compares for skip-unchanged (artifact for rendered kinds, source for pages). */
const entityHash = (value: { artifactHash?: string; sourceHash?: string }): string | undefined => value.artifactHash ?? value.sourceHash;

/**
 * Run one build covering every entity of the kind, so a bulk publish builds once instead of per id.
 * Pages carry no rendered artifacts. Components need the global artifacts + all components; patterns
 * additionally need all patterns composed (each references pre-built component HTML).
 */
const runBulkBuild = async (handoff: Handoff, kind: TransferEntityKind): Promise<void> => {
  if (kind === 'page') {
    return;
  }
  await buildMainJS(handoff);
  await buildMainCss(handoff);
  await processComponents(handoff);
  if (kind === 'pattern') {
    await processPatterns(handoff);
  }
};

/** List every declared entity id of the kind from the workspace store. */
const listWorkspaceEntityIds = async (handoff: Handoff, kind: TransferEntityKind): Promise<string[]> => {
  const stores = { component: handoff.store.components, pattern: handoff.store.patterns, page: handoff.store.pages };
  const store = stores[kind];
  if (!store) {
    throw new PublishError(`Unknown entity kind "${kind}".`);
  }
  return (await store.list()).map((entity) => entity.id);
};

/**
 * Narrow the workspace's declared ids to the requested subset, naming any id that is not declared
 * here instead of silently publishing fewer entities than asked for.
 */
const selectEntityIds = (available: string[], requested: string[] | undefined, kind: TransferEntityKind): string[] => {
  const { selected, unknown } = selectIds(available, requested);
  if (unknown.length > 0) {
    throw new PublishError(
      `No ${kind} named ${unknown.map((id) => `"${id}"`).join(', ')} is declared in this workspace. ` +
        `Declared ${kind}s: ${available.join(', ') || '(none)'}.`
    );
  }
  return selected;
};

/**
 * Publish the components, patterns or pages declared in this connected workspace: every one of the
 * kind, or only `ids` when given. Builds the kind once, assembles each entity's package, skips
 * entities whose content hash already matches the registry (unless `--force`), and reports
 * published/unchanged/failed counts. A per-entity failure is collected and never aborts the rest; the
 * run throws at the end if any entity failed.
 */
export const publishEntities = async (handoff: Handoff, kind: TransferEntityKind, ids?: string[]): Promise<void> => {
  const { client, url } = await resolveTransport(handoff);

  if (!handoff.skipBuild) {
    Logger.info(`Building ${kind}s for publish…`);
    await runBulkBuild(handoff, kind);
  }

  const targets = selectEntityIds(await listWorkspaceEntityIds(handoff, kind), ids, kind);
  if (targets.length === 0) {
    Logger.success(`No ${kind}s are declared in this workspace; nothing to publish.`);
    return;
  }

  // Without a registry there is nothing to compare against, so a dry run reports every target.
  let remote: EntitySummary[] = [];
  if (client && !handoff.force) {
    try {
      remote = await client.listEntities(kind);
    } catch {
      // If the summary listing fails we simply publish everything (the server still overwrites in place).
      Logger.info(`Could not read current registry ${kind}s; publishing all.`);
    }
  }
  const remoteHashById = new Map(remote.map((entry) => [entry.id, entityHash(entry)]));

  let published = 0;
  let unchanged = 0;
  const failed: { id: string; message: string }[] = [];

  for (const id of targets) {
    try {
      const pkg = await buildPublishPackage(handoff, kind, id);
      assertRequiredArtifactsPresent(pkg);

      const remoteHash = remoteHashById.get(id);
      const localHash = entityHash(pkg.build);
      if (!handoff.force && remoteHash && localHash && remoteHash === localHash) {
        unchanged += 1;
        Logger.info(`Unchanged: ${id}`);
        continue;
      }

      if (client) {
        await client.publish(kind, id, pkg);
      }
      published += 1;
      Logger.info(`${publishedLabel(handoff)}: ${id} (${pkg.artifacts.length} artifact(s), ${pkg.files.length} source file(s))`);
    } catch (error) {
      failed.push({ id, message: describePublishError(error, url, 'package') });
    }
  }

  Logger.success(
    `${kind[0].toUpperCase()}${kind.slice(1)}s publish complete — ${published} ${handoff.dryRun ? 'would be published' : 'published'}, ` +
      `${unchanged} unchanged${failed.length ? `, ${failed.length} failed` : ''}.`
  );
  if (failed.length > 0) {
    for (const failure of failed) {
      Logger.error(`  - ${failure.id}: ${failure.message}`);
    }
    throw new PublishError(`${failed.length} ${kind}(s) failed to publish.`);
  }
};
