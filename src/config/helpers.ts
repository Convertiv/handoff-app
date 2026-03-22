import { Config } from '../types/config';

const normalizeAppConfig = (app?: Config['app']): Config['app'] => {
  if (!app) return app;

  const {
    googleTagManager,
    typeCopy,
    typeSort,
    colorSort,
    componentSort,
    basePath,
    ...rest
  } = app;

  return {
    ...rest,
    google_tag_manager: googleTagManager ?? app.google_tag_manager,
    type_copy: typeCopy ?? app.type_copy,
    type_sort: typeSort ?? app.type_sort,
    color_sort: colorSort ?? app.color_sort,
    component_sort: componentSort ?? app.component_sort,
    base_path: basePath ?? app.base_path,
  };
};

export const normalizeConfig = (config: Config): Config => {
  const { devAccessToken, figmaProjectId, assetsZipLinks, app, ...rest } = config;

  return {
    ...(rest as Config),
    dev_access_token: devAccessToken ?? config.dev_access_token,
    figma_project_id: figmaProjectId ?? config.figma_project_id,
    assets_zip_links: assetsZipLinks ?? config.assets_zip_links,
    app: normalizeAppConfig(app),
  };
};

/**
 * Optional helper for strongly-typed config authoring.
 * It normalizes modern camelCase keys to legacy runtime keys.
 */
export const defineConfig = (config: Config): Config => normalizeConfig(config);
