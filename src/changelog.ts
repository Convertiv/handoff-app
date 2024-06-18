import isEqual from 'lodash/isEqual.js';
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

export type ChangelogObject<ObjectType> =
  | { type: 'add' | 'delete'; object: ObjectType }
  | { type: 'change'; old: ObjectType; new: ObjectType };

const generateChangelogObjectArr = <T>(prevArr: T[], newArr: T[], discriminator: keyof T): ChangelogObject<T>[] => {
  return [
    // find items that exist in newArr but do not in prevArr and mark them as added
    ...newArr
      .filter((newItem) => !prevArr.find((prevItem) => prevItem[discriminator] === newItem[discriminator]))
      .map((newItem) => ({ type: 'add' as const, object: newItem })),
    // find items that exist in prevArr but do not in newArr and mark them as deleted
    ...prevArr
      .filter((prevItem) => !newArr.find((newItem) => newItem[discriminator] === prevItem[discriminator]))
      .map((prevItem) => ({ type: 'delete' as const, object: prevItem })),
    // find items that exist both in prevArr and newArr, and filter out equals
    ...newArr
      .filter((newItem) => prevArr.find((prevItem) => prevItem[discriminator] === newItem[discriminator]))
      .map((newItem) => {
        const prevItem = prevArr.find((prevItem) => prevItem[discriminator] === newItem[discriminator])!;
        return { type: 'change' as const, old: prevItem, new: newItem };
      })
      .filter((changeItem) => {
        return !isEqual(changeItem.old, changeItem.new);
      }),
  ];
};

const generateChangelogRecord = (prevDoc: DocumentationObject | undefined, newDoc: DocumentationObject): ChangelogRecord | undefined => {
  const colors = generateChangelogObjectArr(prevDoc?.design.color ?? [], newDoc.design.color, 'sass');
  const typography = generateChangelogObjectArr(prevDoc?.design.typography ?? [], newDoc.design.typography, 'name');

  const design =
    colors.length || typography.length
      ? { colors: colors.length ? colors : undefined, typography: typography.length ? typography : undefined }
      : undefined;

  const icons = generateChangelogObjectArr(prevDoc?.assets.icons ?? [], newDoc.assets.icons, 'path');
  const logos = generateChangelogObjectArr(prevDoc?.assets.logos ?? [], newDoc.assets.logos, 'path');

  const assets =
    icons.length || logos.length ? { icons: icons.length ? icons : undefined, logos: logos.length ? logos : undefined } : undefined;

  if (assets || design) {
    return {
      timestamp: new Date().toISOString(),
      design,
      assets,
    };
  }

  return undefined;
};

export default generateChangelogRecord;
