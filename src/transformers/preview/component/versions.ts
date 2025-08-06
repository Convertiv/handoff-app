import semver from 'semver';

export const getLatestVersionForComponent = (versions: string[]): string => versions.sort(semver.rcompare)[0];
