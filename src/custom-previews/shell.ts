// Pure module: the registry imports it without the build pipeline.

export const RENDER_SHELL_SUFFIX = '.render.html';

/** From the shell's opaque origin this load is a CORS request, so the artifact route allows any origin. */
export const CLIENT_ARTIFACT_SUFFIX = '.client.js';

/** The registry replaces this script element's content with the saved args. */
export const RENDER_PROPS_SCRIPT_ID = '__APP_PROPS__';

export const scriptSafeJson = (value: unknown): string =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
