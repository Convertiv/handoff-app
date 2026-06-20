import fs from 'fs-extra';
import path from 'path';
import {
  ArtifactReference,
  SHARED_MAIN_CSS_ARTIFACT_PATH,
  SHARED_MAIN_JS_ARTIFACT_PATH,
  SHARED_STYLES_CSS_ARTIFACT_PATH,
} from '../../../artifacts';
import { buildArtifactUrl } from '../../../artifacts/url';
import Handoff from '../../../index';
import { getComponentOutputPath } from '../component';
import { MAIN_COMPONENT_CSS_FILE, SHARED_COMPONENT_CSS_FILE } from './css';
import { MAIN_COMPONENT_JS_FILE } from './javascript';

/**
 * Centralized shared/global artifact model for generated preview HTML (technical design §7).
 *
 * The shared artifacts (`component/main.css`, `component/main.js`, `component/shared.css`) are
 * optional: each is emitted only when a corresponding source entry is configured and builds
 * successfully. Generated HTML must reference a shared artifact only when it actually exists, so a
 * failed or absent global build never leaves a dangling reference the browser would request.
 *
 * This module is the single place that decides which shared artifacts are present and turns that
 * decision into structured references and the `<link>`/`<script>` tags every renderer emits — so
 * dependency resolution is driven by the artifact model, never by parsing HTML.
 */

/** Which shared/global artifacts currently exist in the component output directory. */
export interface SharedArtifactPresence {
  /** `component/main.js` — the global preview script built from the configured JS entry. */
  mainJs: boolean;
  /** `component/main.css` — the global stylesheet built from the configured SCSS entry. */
  mainCss: boolean;
  /** `component/shared.css` — shared component styles extracted by the SCSS split marker. */
  sharedCss: boolean;
}

/**
 * Resolve which shared/global artifacts are present on disk. Global artifacts are built before
 * component/pattern HTML is generated, so an existence check here reflects whether the artifact can
 * be referenced without producing a missing-file browser request.
 */
export const resolveSharedArtifactPresence = (handoff: Handoff): SharedArtifactPresence => {
  const outputPath = getComponentOutputPath(handoff);
  return {
    mainJs: fs.existsSync(path.join(outputPath, MAIN_COMPONENT_JS_FILE)),
    mainCss: fs.existsSync(path.join(outputPath, MAIN_COMPONENT_CSS_FILE)),
    sharedCss: fs.existsSync(path.join(outputPath, SHARED_COMPONENT_CSS_FILE)),
  };
};

/** Options controlling which shared style references a renderer participates in. */
export interface SharedStyleOptions {
  /**
   * Whether the rendered component opts into the shared-styles split (`component/shared.css`).
   * Only renderers that consume shared styles (Handlebars) set this; it is still gated on the
   * artifact actually existing.
   */
  includeSharedStyles?: boolean;
}

/**
 * Build the structured shared-artifact references a preview/inspect document depends on, filtered to
 * the artifacts that actually exist. Shared/global artifacts are optional references (`required:
 * false`) owned by no entity (`ownerKind: 'asset'`, `ownerId: null`). Stylesheet references precede
 * the script reference so consumers preserve the documented load order.
 */
export const getSharedArtifactReferences = (
  presence: SharedArtifactPresence,
  options?: SharedStyleOptions
): ArtifactReference[] => {
  const references: ArtifactReference[] = [];

  if (options?.includeSharedStyles && presence.sharedCss) {
    references.push({ path: SHARED_STYLES_CSS_ARTIFACT_PATH, kind: 'shared', required: false, ownerKind: 'asset', ownerId: null });
  }
  if (presence.mainCss) {
    references.push({ path: SHARED_MAIN_CSS_ARTIFACT_PATH, kind: 'shared', required: false, ownerKind: 'asset', ownerId: null });
  }
  if (presence.mainJs) {
    references.push({ path: SHARED_MAIN_JS_ARTIFACT_PATH, kind: 'shared', required: false, ownerKind: 'asset', ownerId: null });
  }

  return references;
};

/**
 * Render the `<link rel="stylesheet">` tags for the present shared stylesheet artifacts
 * (`component/shared.css` then `component/main.css`), in load order. Returns the tags joined by a
 * newline, or an empty string when no shared stylesheet exists.
 */
export const renderSharedStyleLinks = (
  presence: SharedArtifactPresence,
  basePath: string,
  options?: SharedStyleOptions
): string =>
  getSharedArtifactReferences(presence, options)
    .filter((ref) => ref.path.endsWith('.css'))
    .map((ref) => `<link rel="stylesheet" href="${buildArtifactUrl(ref.path, basePath)}">`)
    .join('\n');

/**
 * Render the global preview script tag for `component/main.js` when present, or an empty string when
 * absent. The global script is a classic (non-deferred) tag so it executes before dependent
 * component-specific scripts and preserves intentional top-level side effects.
 */
export const renderGlobalScriptTag = (presence: SharedArtifactPresence, basePath: string): string =>
  presence.mainJs ? `<script src="${buildArtifactUrl(SHARED_MAIN_JS_ARTIFACT_PATH, basePath)}"></script>` : '';

/** Which of a component's own optional artifacts exist in the component output directory. */
export interface ComponentArtifactPresence {
  /** `component/<id>.css` — built only when the component declares an SCSS/CSS entry. */
  css: boolean;
  /** `component/<id>.js` — built only when the component declares a JS entry. */
  js: boolean;
}

/**
 * Resolve which of a component's own css/js artifacts exist on disk. A component's styles and
 * scripts are built (or removed when their entry is absent) before its preview HTML is generated, so
 * an existence check here reflects whether the artifact can be referenced without producing a
 * missing-file browser request. Like the shared artifacts, these references are optional.
 */
export const resolveComponentArtifactPresence = (handoff: Handoff, componentId: string): ComponentArtifactPresence => {
  const outputPath = getComponentOutputPath(handoff);
  return {
    css: fs.existsSync(path.join(outputPath, `${componentId}.css`)),
    js: fs.existsSync(path.join(outputPath, `${componentId}.js`)),
  };
};

/**
 * Render the `<link rel="stylesheet">` tag for a component's own stylesheet (`component/<id>.css`)
 * when it exists, or an empty string when the component declares no styles — so generated HTML never
 * references an absent optional artifact.
 */
export const renderComponentStyleLink = (presence: ComponentArtifactPresence, componentId: string, basePath: string): string =>
  presence.css ? `<link rel="stylesheet" href="${buildArtifactUrl(`component/${componentId}.css`, basePath)}">` : '';

/**
 * Render the `<script>` tag for a component's own script (`component/<id>.js`) when it exists, or an
 * empty string when the component declares no script. The component script is a classic tag loaded
 * after the global script so global side effects run first.
 */
export const renderComponentScriptTag = (presence: ComponentArtifactPresence, componentId: string, basePath: string): string =>
  presence.js ? `<script src="${buildArtifactUrl(`component/${componentId}.js`, basePath)}"></script>` : '';
