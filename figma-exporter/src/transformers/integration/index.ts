import fs from 'fs-extra';
import path from 'path';
import { getPathToIntegration } from '../../utils/config';

/**
 * Find the integration to sync and sync the sass files and template files.
 */
export default async function integrationTransformer() {
  const integrationPath = getPathToIntegration();
  const sassFolder = process.env.OUTPUT_DIR || 'exported/framework_integration';
  const templatesFolder = process.env.OUTPUT_DIR || 'templates';
  const integrationsSass = path.resolve(integrationPath, 'sass');
  const integrationTemplates = path.resolve(integrationPath, 'templates');
  fs.copySync(integrationsSass, sassFolder)
  fs.copySync(integrationTemplates, templatesFolder)
}
