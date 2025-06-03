import Handoff from '../../../index';
declare const getVersionsForComponent: (handoff: Handoff, id: string) => Promise<string[]>;
export declare const getLatestVersionForComponent: (versions: string[]) => string;
export default getVersionsForComponent;
