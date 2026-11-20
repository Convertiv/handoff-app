/**
 * `handoff-app/screens`: definitions, hooks and UI for screen views and collections.
 *
 * The definitions and helpers below run anywhere. The hooks and components exist only inside the
 * docs app: the app build maps this entry point to its implementation, which is checked against the
 * types in `./client-api`. Import server-only code from `handoff-app/screens/server` in `tools.ts`.
 */
import type * as Api from './client-api';

export * from './runtime';
export type * from './public-types';

export declare const useCollection: Api.UseCollection;
export declare const useDocument: Api.UseDocument;
export declare const useComponents: Api.UseComponents;
export declare const useComponent: Api.UseComponent;
export declare const loadComponent: Api.LoadComponent;
export declare const usePatterns: Api.UsePatterns;
export declare const useDocsApi: Api.UseDocsApi;
export declare const useSession: Api.UseSession;
export declare const useScreenRoute: Api.UseScreenRoute;
export declare const useCustomPreviews: Api.UseCustomPreviews;
export declare const useAssistantContext: Api.UseAssistantContext;
export declare const useInstanceAssessment: Api.UseInstanceAssessment;
export declare const assessInstances: Api.AssessInstances;
export declare const isScreenChrome: Api.IsScreenChrome;
export declare const ComponentPreview: import('react').FC<Api.ComponentPreviewProps>;
export declare const CustomPreview: import('react').FC<Api.CustomPreviewProps>;
export declare const ComponentCanvas: import('react').FC<Api.ComponentCanvasProps>;
export declare const ArgsForm: import('react').FC<Api.ArgsFormProps>;
export declare const ScreenLayout: Api.ScreenLayoutComponent;
export declare const DocumentMenu: Api.DocumentMenuComponent;
export declare const ViewportToggle: import('react').FC<Api.ViewportToggleProps>;
export declare const ui: Api.ScreenUi;
