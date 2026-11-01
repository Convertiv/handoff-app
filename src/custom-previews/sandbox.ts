/**
 * Saved args can run script, for example through Handlebars `{{{prop}}}`.
 * The shell runs at an opaque origin, so that script cannot act as the viewer.
 * Shell routes also send this as a CSP. Never add `allow-same-origin`.
 */
export const CUSTOM_PREVIEW_FRAME_SANDBOX = 'allow-scripts';

export const CUSTOM_PREVIEW_CONTENT_SECURITY_POLICY = `sandbox ${CUSTOM_PREVIEW_FRAME_SANDBOX}`;
