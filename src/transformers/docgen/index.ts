import fs from 'fs-extra';
import path from 'path';
import { createGenerator, type DocGenerator, type GeneratedDocs } from 'handoff-docgen';
import { Logger } from '../../utils/logger';
import { SlotMetadata, SlotType } from '../preview/component';

const DEFAULT_DOCGEN_MAX_DEPTH = 7;
const DEFAULT_DOCGEN_EXCLUDE_DIRECTORIES = ['dist', 'build', '.next'];
const generatorCache = new Map<string, DocGenerator>();

const normalizePathForCompare = (filePath: string): string => filePath.replace(/\\/g, '/');

const mapDocgenTypeToSlotType = (typeName: string): SlotType => {
  const normalizedType = typeName?.trim().toLowerCase();

  switch (normalizedType) {
    case 'boolean':
      return SlotType.BOOLEAN;
    case 'number':
      return SlotType.NUMBER;
    case 'string':
      return SlotType.TEXT;
    case 'array':
      return SlotType.ARRAY;
    case 'object':
      return SlotType.OBJECT;
    case 'function':
      return SlotType.FUNCTION;
    case 'enum':
      return SlotType.ENUM;
    case 'any':
    case 'unknown':
      return SlotType.ANY;
    default:
      if (normalizedType?.includes('=>')) {
        return SlotType.FUNCTION;
      }
      return SlotType.TEXT;
  }
};

const getDocgenConfig = (handoff: any): { maxDepth: number; excludeDirectories: string[] } => {
  const reactDocgenConfig = handoff?.config?.reactDocgen ?? handoff?.config?.docgen;
  const configuredMaxDepth = reactDocgenConfig?.maxDepth;
  const configuredExcludeDirectories = reactDocgenConfig?.excludeDirectories;

  const maxDepth =
    typeof configuredMaxDepth === 'number' && Number.isFinite(configuredMaxDepth) && configuredMaxDepth > 0
      ? Math.floor(configuredMaxDepth)
      : DEFAULT_DOCGEN_MAX_DEPTH;

  const excludeDirectories = Array.isArray(configuredExcludeDirectories)
    ? configuredExcludeDirectories
        .map((entry) => String(entry).trim())
        .filter((entry) => entry.length > 0)
    : DEFAULT_DOCGEN_EXCLUDE_DIRECTORIES;

  return {
    maxDepth,
    excludeDirectories: excludeDirectories.length > 0 ? excludeDirectories : DEFAULT_DOCGEN_EXCLUDE_DIRECTORIES,
  };
};

const getGenerator = (
  componentDirectory: string,
  tsconfigPath: string,
  maxDepth: number,
  excludeDirectories: string[]
): DocGenerator => {
  const cacheKey = `${componentDirectory}::${tsconfigPath}::${maxDepth}::${excludeDirectories.join('|')}`;
  const cached = generatorCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const generator = createGenerator({
    componentDirectory,
    tsconfigPath,
    maxDepth,
    pathMode: 'relative',
    excludeDirectories,
  });

  generatorCache.set(cacheKey, generator);
  return generator;
};

const findComponentDocForEntry = (generatedDocs: GeneratedDocs, entry: string, handoff: any) => {
  const normalizedEntryAbsolute = normalizePathForCompare(path.resolve(entry));
  const normalizedEntryRelative = normalizePathForCompare(path.relative(handoff.workingPath, normalizedEntryAbsolute));
  const entryBasename = path.basename(normalizedEntryAbsolute, path.extname(normalizedEntryAbsolute));

  const matchesByFile = generatedDocs.components.filter((component) => {
    const source = normalizePathForCompare(component.sourceFile);
    return source === normalizedEntryAbsolute || source === normalizedEntryRelative || source.endsWith(`/${normalizedEntryRelative}`);
  });

  if (matchesByFile.length > 0) {
    return matchesByFile[0];
  }

  const matchesByName = generatedDocs.components.filter((component) => component.name === entryBasename);
  if (matchesByName.length > 0) {
    return matchesByName[0];
  }

  return generatedDocs.components[0];
};

const toSlotMetadata = (prop: any): SlotMetadata => {
  const slotType = mapDocgenTypeToSlotType(prop.docgenType || prop.deepType?.kind || 'any');
  const deepType = prop.deepType;
  const metadata: SlotMetadata = {
    id: prop.name,
    name: prop.name,
    description: prop.description || '',
    generic: deepType?.display || prop.docgenType || '',
    default: prop.defaultValue,
    type: slotType,
    rules: {
      required: !!prop.required,
    },
    docgenType: prop.docgenType,
    deepType: prop.deepType,
    typeRefs: prop.typeRefs,
    warnings: prop.warnings,
    annotations: prop.annotations,
  };

  if (deepType?.kind === 'object' && deepType.properties?.length) {
    metadata.type = SlotType.OBJECT;
    metadata.properties = Object.fromEntries(
      deepType.properties.map((property) => [
        property.name,
        toSlotMetadata({
          name: property.name,
          required: !property.optional,
          description: property.description,
          docgenType: property.type?.display || property.type?.kind || 'unknown',
          deepType: property.type,
          annotations: property.annotations,
        }),
      ])
    );
  } else if (deepType?.kind === 'array' && deepType.elementType) {
    metadata.type = SlotType.ARRAY;
    metadata.items = {
      type: mapDocgenTypeToSlotType(deepType.elementType.display || deepType.elementType.kind),
      properties:
        deepType.elementType.kind === 'object' && deepType.elementType.properties
          ? Object.fromEntries(
              deepType.elementType.properties.map((property) => [
                property.name,
                toSlotMetadata({
                  name: property.name,
                  required: !property.optional,
                  description: property.description,
                  docgenType: property.type?.display || property.type?.kind || 'unknown',
                  deepType: property.type,
                  annotations: property.annotations,
                }),
              ])
            )
          : undefined,
    };
  }

  return metadata;
};

const toPropertiesMap = (generatedDocs: GeneratedDocs, entry: string, handoff: any): { [key: string]: SlotMetadata } | null => {
  if (!generatedDocs.components.length) {
    return null;
  }

  const componentDoc = findComponentDocForEntry(generatedDocs, entry, handoff);
  if (!componentDoc || !componentDoc.props?.length) {
    return null;
  }

  const properties: { [key: string]: SlotMetadata } = {};
  for (const prop of componentDoc.props) {
    properties[prop.name] = toSlotMetadata(prop);
  }

  return properties;
};

/**
 * Get SlotMetadata map for a specific component by name from generated docs.
 * Used when a file has multiple components (e.g. CSF with CardRow + Card) and we need
 * the one that matches meta.component (e.g. CardRow).
 */
export const getPropertiesForComponentFromDocs = (
  generatedDocs: GeneratedDocs,
  componentName: string
): { [key: string]: SlotMetadata } | null => {
  if (!generatedDocs?.components?.length || !componentName) {
    return null;
  }
  const componentDoc = generatedDocs.components.find(
    (c) => c.name === componentName
  );
  if (!componentDoc || !componentDoc.props?.length) {
    return null;
  }
  const properties: { [key: string]: SlotMetadata } = {};
  for (const prop of componentDoc.props) {
    properties[prop.name] = toSlotMetadata(prop);
  }
  return properties;
};

export const getPropertiesFromGeneratedDocs = (
  generatedDocs: GeneratedDocs,
  entry: string,
  handoff: any
): { [key: string]: SlotMetadata } | null => toPropertiesMap(generatedDocs, entry, handoff);

export const enrichPropertiesWithDocgen = (
  properties: { [key: string]: SlotMetadata } | null | undefined,
  docgenProperties: { [key: string]: SlotMetadata } | null | undefined
): { [key: string]: SlotMetadata } | null => {
  if (!properties && !docgenProperties) {
    return null;
  }

  if (!properties) {
    return docgenProperties || null;
  }

  if (!docgenProperties) {
    return properties;
  }

  const merged: { [key: string]: SlotMetadata } = { ...properties };
  const docgenEntries = Object.entries(docgenProperties);

  for (const [propName, docgenProp] of docgenEntries) {
    const existing = merged[propName];
    if (!existing) {
      merged[propName] = docgenProp;
      continue;
    }

    merged[propName] = {
      ...existing,
      generic: existing.generic || docgenProp.generic,
      default: existing.default || docgenProp.default,
      docgenType: docgenProp.docgenType,
      deepType: docgenProp.deepType,
      typeRefs: docgenProp.typeRefs,
      warnings: docgenProp.warnings,
      annotations: docgenProp.annotations,
    };
  }

  return merged;
};

export const generateDocsArtifact = async (entry: string, handoff: any): Promise<GeneratedDocs | null> => {
  try {
    const tsconfigPath = path.resolve(handoff.workingPath, 'tsconfig.json');
    if (!fs.existsSync(tsconfigPath)) {
      Logger.warn(`TypeScript config not found at ${tsconfigPath}, using default resolution`);
    }

    const componentDirectory = path.dirname(path.resolve(entry));
    const { maxDepth, excludeDirectories } = getDocgenConfig(handoff);
    const generator = getGenerator(componentDirectory, tsconfigPath, maxDepth, excludeDirectories);
    return await generator.generate({
      componentDirectory,
      tsconfigPath,
      maxDepth,
      pathMode: 'relative',
      excludeDirectories,
    });
  } catch (error) {
    Logger.warn(`Failed to generate docs with handoff-docgen for ${entry}: ${error}`);
    return null;
  }
};

export const generatePropertiesFromDocgen = async (
  entry: string,
  handoff: any
): Promise<{ [key: string]: any } | null> => {
  const generatedDocs = await generateDocsArtifact(entry, handoff);
  if (!generatedDocs) {
    return null;
  }

  return getPropertiesFromGeneratedDocs(generatedDocs, entry, handoff);
};
