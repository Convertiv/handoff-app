'use client';

/**
 * What `handoff-app/screens` resolves to inside the docs app (see the aliases in `next.config.mjs`).
 * The public declarations in `src/screens/index.ts` describe these exports; each one is typed
 * against `src/screens/client-api.ts` here, so the two cannot drift apart.
 */
import type * as Api from '@handoff/screens/client-api';
import type * as PublicEntry from '@handoff/screens/index';
import type { FC } from 'react';
import {
  ArgsForm as ArgsFormImpl,
  ComponentPreview as ComponentPreviewImpl,
  CustomPreview as CustomPreviewImpl,
  ViewportToggle as ViewportToggleImpl,
} from '../../components/Screens/Previews';
import { ComponentCanvas as ComponentCanvasImpl } from '../../components/Screens/ComponentCanvas';
import { DocumentMenu as DocumentMenuImpl } from '../../components/Screens/DocumentMenu';
import { ui as uiImpl } from '../../components/Screens/primitives';
import { ScreenLayout as ScreenLayoutImpl } from '../../components/Screens/ScreenLayout';
import {
  useAssistantContext as useAssistantContextImpl,
  useScreenRoute as useScreenRouteImpl,
  useSession as useSessionImpl,
} from './client/context';
import { isScreenChrome as isScreenChromeImpl } from './client/chrome';
import { useCollection as useCollectionImpl, useDocument as useDocumentImpl } from './client/data';
import {
  assessInstances as assessInstancesImpl,
  loadComponent as loadComponentImpl,
  useComponent as useComponentImpl,
  useComponents as useComponentsImpl,
  useCustomPreviews as useCustomPreviewsImpl,
  useDocsApi as useDocsApiImpl,
  useInstanceAssessment as useInstanceAssessmentImpl,
  usePatterns as usePatternsImpl,
} from './client/docs';

export * from '@handoff/screens/runtime';
// The same types as the public entry, so a screen type-checks alike in the app build and in an editor.
export type * from '@handoff/screens/public-types';

export const useCollection: Api.UseCollection = useCollectionImpl;
export const useDocument: Api.UseDocument = useDocumentImpl;
export const useComponents: Api.UseComponents = useComponentsImpl;
export const useComponent: Api.UseComponent = useComponentImpl;
export const loadComponent: Api.LoadComponent = loadComponentImpl;
export const usePatterns: Api.UsePatterns = usePatternsImpl;
export const useDocsApi: Api.UseDocsApi = useDocsApiImpl;
export const useSession: Api.UseSession = useSessionImpl;
export const useScreenRoute: Api.UseScreenRoute = useScreenRouteImpl;
export const useCustomPreviews: Api.UseCustomPreviews = useCustomPreviewsImpl;
export const useAssistantContext: Api.UseAssistantContext = useAssistantContextImpl;
export const useInstanceAssessment: Api.UseInstanceAssessment = useInstanceAssessmentImpl;
export const assessInstances: Api.AssessInstances = assessInstancesImpl;
export const isScreenChrome: Api.IsScreenChrome = isScreenChromeImpl;
export const ComponentPreview: FC<Api.ComponentPreviewProps> = ComponentPreviewImpl;
export const CustomPreview: FC<Api.CustomPreviewProps> = CustomPreviewImpl;
export const ComponentCanvas: FC<Api.ComponentCanvasProps> = ComponentCanvasImpl;
export const ArgsForm: FC<Api.ArgsFormProps> = ArgsFormImpl;
export const ScreenLayout: Api.ScreenLayoutComponent = ScreenLayoutImpl;
export const DocumentMenu: Api.DocumentMenuComponent = DocumentMenuImpl;
export const ViewportToggle: FC<Api.ViewportToggleProps> = ViewportToggleImpl;
export const ui: Api.ScreenUi = uiImpl;

// Every value the public entry declares must exist here, and nothing more: a missing name would be
// `undefined` in a screen, an extra one would type-check in the app but not in the screen's editor.
// A type error here names the export to add to `src/screens/index.ts` or to this file.
type ExportDrift =
  | Exclude<keyof typeof PublicEntry, keyof typeof import('./sdk')>
  | Exclude<keyof typeof import('./sdk'), keyof typeof PublicEntry>;
type ExportsMatch = [ExportDrift] extends [never] ? true : { missingOrExtra: ExportDrift };
const exportsMatchPublicEntry: ExportsMatch = true;
void exportsMatchPublicEntry;
