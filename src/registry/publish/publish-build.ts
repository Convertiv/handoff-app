import crypto from 'crypto';
import type { TransferBuild } from '../transfer';

type BuildHashInput = Pick<TransferBuild, 'artifactHash'> | Pick<TransferBuild, 'sourceHash'>;

export interface HashPathValue {
  path: string;
  value: string;
}

let cachedBuilderVersion: string | undefined;

/** Resolve the package version stamped into publish build metadata. */
const getBuilderVersion = (): string => {
  if (cachedBuilderVersion) {
    return cachedBuilderVersion;
  }
  try {
    const pkg = require('../../../package.json');
    cachedBuilderVersion = typeof pkg.version === 'string' ? pkg.version : '0.0.0';
  } catch {
    cachedBuilderVersion = '0.0.0';
  }
  return cachedBuilderVersion;
};

export const sha256 = (content: string): string => crypto.createHash('sha256').update(content).digest('hex');

/** Hash path and value pairs in path order, with an optional serialized record prefix. */
export const hashPathValues = (entries: HashPathValue[], prefix?: string): string => {
  const hash = crypto.createHash('sha256');
  if (prefix !== undefined) {
    hash.update(prefix);
    hash.update('\0');
  }
  for (const entry of [...entries].sort((left, right) => left.path.localeCompare(right.path))) {
    hash.update(entry.path);
    hash.update('\0');
    hash.update(entry.value);
    hash.update('\0');
  }
  return hash.digest('hex');
};

/** Create the common build metadata for a freshly built publish payload. */
export const createCurrentBuild = (hash: BuildHashInput): TransferBuild => ({
  status: 'current',
  builtAt: new Date().toISOString(),
  builderVersion: getBuilderVersion(),
  ...hash,
});
