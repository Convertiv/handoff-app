import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get the component template
 * @param component
 * @param parts
 * @returns
 */
export const getComponentTemplate = async (component: string, ...parts: string[]): Promise<string | null> => {
  const componentFallbackPath = path.resolve(__dirname, `../../templates/${component}/default.html`);
  const componentFallbackOverridePath = path.resolve(process.cwd(), `integration/templates/${component}/default.html`);

  if (!parts.length) {
    if (await fs.pathExists(componentFallbackOverridePath)) {
      return await fs.readFile(componentFallbackOverridePath, 'utf8');
    }else if (await fs.pathExists(componentFallbackPath)) {
      return await fs.readFile(componentFallbackPath, 'utf8');
    }

    return null;
  }

  const partsTemplatePath = path.resolve(__dirname, `../../templates/${component}/${parts.join('/')}.html`);
  const partsTemplateOverridePath = path.resolve(process.cwd(), `integration/templates/${component}/${parts.join('/')}.html`);
  if (await fs.pathExists(partsTemplateOverridePath)) {
    return await fs.readFile(partsTemplateOverridePath, 'utf8');
  }else if (await fs.pathExists(partsTemplatePath)) {
    return await fs.readFile(partsTemplatePath, 'utf8');
  }

  return await getComponentTemplate(component, ...parts.slice(0, -1));
};
