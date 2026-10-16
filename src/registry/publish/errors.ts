import { RegistryClientError } from '../client';

export type RejectedPublishPayload = 'package' | 'token set' | 'asset collection';

/** Map registry error codes to the actionable messages used by publish commands. */
export const describeUploadFailure = (
  error: RegistryClientError,
  registryUrl: string,
  rejectedPayload: RejectedPublishPayload
): string => {
  switch (error.code) {
    case 'runtime_mode_conflict':
      return `The registry at ${registryUrl} is not running in registry mode, so it cannot accept publishes: ${error.message}`;
    case 'unauthorized':
      return `The registry rejected the access token (401). Run \`handoff-app login --url ${registryUrl}\` again, or replace the user-issued CI token.`;
    case 'forbidden':
      return `The registry token does not have permission to publish (403). Sign in as an administrator and authorize a token with registry:write access.`;
    case 'bad_request':
      return `The registry rejected the ${rejectedPayload} (400): ${error.message}`;
    default:
      return error.message;
  }
};

export const describePublishError = (
  error: unknown,
  registryUrl: string,
  rejectedPayload: RejectedPublishPayload
): string =>
  error instanceof RegistryClientError
    ? describeUploadFailure(error, registryUrl, rejectedPayload)
    : error instanceof Error
      ? error.message
      : String(error);
