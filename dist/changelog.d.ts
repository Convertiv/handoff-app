import { Types as HandoffTypes } from 'handoff-core';
import { AssetObject } from './types';
export interface ChangelogRecord {
    timestamp: string;
    design?: {
        colors?: ChangelogObject<HandoffTypes.IColorObject>[];
        typography?: ChangelogObject<HandoffTypes.ITypographyObject>[];
    };
    assets?: {
        icons?: ChangelogObject<AssetObject>[];
        logos?: ChangelogObject<AssetObject>[];
    };
}
export interface ChangeLogEntry {
    type: string;
}
export declare type ChangelogObject<ObjectType> = {
    type: 'add' | 'delete';
    object: ObjectType;
} | {
    type: 'change';
    old: ObjectType;
    new: ObjectType;
};
declare const generateChangelogRecord: (prevDoc: HandoffTypes.IDocumentationObject | undefined, newDoc: HandoffTypes.IDocumentationObject) => ChangelogRecord | undefined;
export default generateChangelogRecord;
