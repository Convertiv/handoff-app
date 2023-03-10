import path from 'path';
import fs from 'fs-extra';

export const getComponentTemplate = async (component: string, ...parts: string[]): Promise<string | null> => {
  const componentFallbackPath = path.resolve(__dirname, `../../templates/${component}/default.html`);

  if (!parts.length) {
    if (await fs.pathExists(componentFallbackPath)) {
      return await fs.readFile(componentFallbackPath, 'utf8');
    }

    return null;
  }

  const partsTemplatePath = path.resolve(__dirname, `../../templates/${component}/${parts.join('/')}.html`);

  if (await fs.pathExists(partsTemplatePath)) {
    return await fs.readFile(partsTemplatePath, 'utf8');
  }

  return await getComponentTemplate(component, ...parts.slice(0, -1));
};
