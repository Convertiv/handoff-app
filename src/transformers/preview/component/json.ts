import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { ComponentType, TransformComponentTokensResult } from '../types';

const parseComponentJson = async (
  id: string,
  location: string,
  data: TransformComponentTokensResult
): Promise<TransformComponentTokensResult> => {
  // Is there a JSON file with the same name?
  const jsonFile = id + '.json';
  const jsonPath = path.resolve(location, jsonFile);
  let parsed: any = {};
  if (fs.existsSync(jsonPath)) {
    const json = await fs.readFile(jsonPath, 'utf8');
    if (json) {
      try {
        parsed = JSON.parse(json);
        // The JSON file defines each of the fields
        if (parsed) {
          data.title = parsed.title;
          data.image = parsed.image;
          data.should_do = parsed.should_do || [];
          data.should_not_do = parsed.should_not_do || [];
          data.type = (parsed.type as ComponentType) || ComponentType.Element;
          data.group = parsed.group || 'default';
          data.tags = parsed.tags || [];
          data.categories = parsed.categories || [];
          data.figma = parsed.figma || '';
          data.description = parsed.description;
          data.properties = parsed.properties;
          data.previews = parsed.previews;
          data.previewOptions = parsed.previewOptions;
        }
      } catch (e) {
        console.log(chalk.red(`Error parsing JSON for ${id}`));
        console.log(e);
      }
    }
  } else {
    console.log(chalk.red(`No JSON file found for ${id}`));
  }
  return data;
};
export default parseComponentJson;
