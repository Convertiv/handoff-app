import * as stream from 'node:stream';
import axios from 'axios';
import archiver from 'archiver';
import { getAssetURL, getFileComponent } from '../figma/api.js';
import * as Utils from '../utils/index.js';
import { AssetObject } from '../types.js';
import chalk from 'chalk';
const defaultExtension: string = 'svg';

const assetsExporter = async (fileId: string, accessToken: string, component: string) => {
  try {
    const parent_response = await getFileComponent(fileId, accessToken);
    const asset_components = Object.entries(parent_response.data.meta.components)
      .filter(([_, value]) => value.containing_frame.name?.indexOf(component) > -1)
      .map(([key, value]) => {
        return {
          id: key,

          description: value.description,
          key: value.key,
          name: value.name,
        };
      });

    const numOfAssets = asset_components.length;
    console.log(chalk.green(`${component} exported:`), numOfAssets);

    if (!numOfAssets) {
      return [];
    }
    const assetsUrlsRes = await getAssetURL(
      fileId,
      Object.entries(parent_response.data.meta.components)
        .filter(([_, value]) => value.containing_frame.name?.indexOf(component) > -1)
        .sort(([a_key, a_val], [b_key, b_val]) => {
          // Fetch node ids
          a_key;
          b_key;
          const a_parts = a_val.node_id.split(':');
          const b_parts = b_val.node_id.split(':');
          let a_sort = 0,
            b_sort = 0;
          if (a_parts[1]) {
            a_sort = parseInt(a_parts[0]) + parseInt(a_parts[1]);
          }
          if (b_parts[1]) {
            b_sort = parseInt(b_parts[0]) + parseInt(b_parts[1]);
          }
          return a_sort - b_sort;
        })
        .map(([key, _]) => {
          key;
          return _.node_id;
        }),
      defaultExtension,
      accessToken
    );
    const assetsList = await Promise.all(
      Object.entries(assetsUrlsRes.data.images).map(async ([assetId, assetUrl]): Promise<AssetObject | null> => {
        const componentData = parent_response.data.meta.components.filter((value) => value.node_id === assetId).shift();
        if (componentData) {
          const svgData = await axios.get<string>(assetUrl);
          const assetName = Utils.slugify(componentData.name ?? '');
          const filename = assetName + '.' + defaultExtension;

          return {
            path: filename,
            name: assetName,
            icon: assetName,
            description: componentData.description,
            index: assetName.toLowerCase().replace(/[\W_]+/g, ' '),
            size: svgData.data.length,
            data: svgData.data.replace(/(\r\n|\n|\r)/gm, ''),
          };
        } else {
          return null;
        }
      })
    );
    return assetsList.filter(Utils.filterOutNull);
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const zipAssets = async (assets: AssetObject[], destination: stream.Writable) => {
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Sets the compression level.
  });

  // good practice to catch this error explicitly
  archive.on('error', function (err) {
    throw err;
  });

  archive.pipe(destination);

  assets.forEach((asset) => {
    archive.append(asset.data, { name: asset.path });
  });

  await archive.finalize();

  return destination;
};

export default assetsExporter;
