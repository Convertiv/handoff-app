import { AssetObject, ColorObject, DocumentationObject, TypographyObject } from './types.js';
export interface ChangelogRecord {
    timestamp: string;
    design?: {
        colors?: ChangelogObject<ColorObject>[];
        typography?: ChangelogObject<TypographyObject>[];
    };
    assets?: {
        icons?: ChangelogObject<AssetObject>[];
        logos?: ChangelogObject<AssetObject>[];
    };
}
export interface ChangeLogEntry {
    type: string;
}
export type ChangelogObject<ObjectType> = {
    type: 'add' | 'delete';
    object: ObjectType;
} | {
    type: 'change';
    old: ObjectType;
    new: ObjectType;
};
declare const generateChangelogRecord: (prevDoc: DocumentationObject | undefined, newDoc: DocumentationObject) => ChangelogRecord | undefined;
export default generateChangelogRecord;
