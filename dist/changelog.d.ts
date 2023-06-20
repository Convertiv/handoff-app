import { AssetObject, ColorObject, DocumentationObject, TypographyObject } from './types';
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
export declare type ChangelogObject<ObjectType> = {
    type: 'add' | 'delete';
    object: ObjectType;
} | {
    type: 'change';
    old: ObjectType;
    new: ObjectType;
};
declare const generateChangelogRecord: (prevDoc: DocumentationObject | undefined, newDoc: DocumentationObject) => ChangelogRecord | undefined;
export default generateChangelogRecord;
