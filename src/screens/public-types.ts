/** Every type of `handoff-app/screens`. The public entry and the app's implementation both re-export this file. */
export type {
  AnyCollection,
  Collection,
  CollectionMcpOptions,
  CollectionMigrations,
  CollectionOptions,
  ComponentInstance,
  DocumentOf,
  ScreenAccess,
  ScreenDefinition,
  ScreenNavOptions,
  ScreenOptions,
  ScreenRole,
  ToolScope,
} from './define';
export type { FromSchema, JsonObjectSchema, JsonSchema, JsonSchemaType } from './schema';
export type { SchemaIssue } from './validate';
export type { CreateInstanceOptions } from './instances';
export type {
  ArgsAssessment,
  ArgsIssue,
  CollectionPage,
  CollectionQuery,
  CollectionSort,
  ComponentInfo,
  ComponentQuery,
  ComponentSummary,
  DocumentRef,
  InstanceAssessment,
  PatternInfo,
  PatternQuery,
  StoredDocument,
} from './types';
export type * from './client-api';
