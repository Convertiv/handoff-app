import axios, { AxiosInstance } from 'axios';
import { FileResponse, FileNodesResponse, FileImageResponse, FileStylesResponse, FileComponentSetsResponse, FileComponentsResponse } from './types';

const figmaRestApi: AxiosInstance = axios.create({
  baseURL: process.env.FIGMA_BASE_URL || 'https://api.figma.com/v1/',
});

let counter = 0;

export const getFile = (fileId: string, accessToken: string) => {
  counter++;
  return figmaRestApi.get<FileResponse>('files/' + fileId, {
    headers: {
      'X-Figma-Token': accessToken,
    },
  });
};
/**
 * Fetch the frontend components
 * @param fileId
 * @param accessToken
 * @returns Promise<FileComponentsResponse>
 */
export const getFileComponent = (fileId: string, accessToken: string) => {
  counter++;
  return figmaRestApi.get<FileComponentsResponse>('files/' + fileId + '/components', {
    headers: {
      'X-Figma-Token': accessToken,
    },
  });
};

export const getFileNodes = (fileId: string, ids: string[], accessToken: string) => {
  counter++;
  return figmaRestApi.get<FileNodesResponse>('files/' + fileId + '/nodes?ids=' + ids.join(','), {
    headers: {
      'X-Figma-Token': accessToken,
    },
  });
};

export const getAssetURL = (fileId: string, ids: string[], extension: string, accessToken: string) => {
  counter++;
  return figmaRestApi.get<FileImageResponse>('images/' + fileId + '/?ids=' + ids.join(',') + '&format=' + extension, {
    headers: {
      'X-Figma-Token': accessToken,
    },
  });
};

export const getFileStyles = (fileId: string, accessToken: string) => {
  counter++;
  return figmaRestApi.get<FileStylesResponse>('files/' + fileId + '/styles', {
    headers: {
      'X-Figma-Token': accessToken,
    },
  });
};

export const getComponentSets = (fileId: string, accessToken: string) => {
  counter++;
  return figmaRestApi.get<FileComponentSetsResponse>('files/' + fileId + '/component_sets', {
    headers: {
      'X-Figma-Token': accessToken,
    },
  });
};

export const getComponentSetNodes = (fileId: string, ids: string[], accessToken: string) => {
  counter++;
  return figmaRestApi.get<FileNodesResponse>('files/' + fileId + '/nodes?ids=' + ids.join(','), {
    headers: {
      'X-Figma-Token': accessToken,
    },
  });
};

export const getRequestCount = () => counter;
export default figmaRestApi;
