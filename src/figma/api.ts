import axios, { AxiosInstance } from 'axios';
import { FileResponse, FileNodesResponse, FileImageResponse, FileStylesResponse, FileComponentSetsResponse, FileComponentsResponse } from './types.js';

const figmaRestApi: AxiosInstance = axios.create({
  baseURL: process.env.HANDOFF_FIGMA_BASE_URL || 'https://api.figma.com/v1/',
});

let counter = 0;

export const getFile = (fileId: string, accessToken: string) => {
  counter++;
  return figmaRestApi.get<FileResponse>('files/' + fileId, {
    headers: {
      ...getFigmaAuthHeaders(accessToken)
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
      ...getFigmaAuthHeaders(accessToken)
    },
  });
};

export const getFileNodes = (fileId: string, ids: string[], accessToken: string) => {
  counter++;
  return figmaRestApi.get<FileNodesResponse>('files/' + fileId + '/nodes?ids=' + ids.join(','), {
    headers: {
      ...getFigmaAuthHeaders(accessToken)
    },
  });
};

export const getAssetURL = (fileId: string, ids: string[], extension: string, accessToken: string) => {
  counter++;
  return figmaRestApi.get<FileImageResponse>('images/' + fileId + '/?ids=' + ids.join(',') + '&format=' + extension, {
    headers: {
      ...getFigmaAuthHeaders(accessToken)
    },
  });
};

export const getFileStyles = (fileId: string, accessToken: string) => {
  counter++;
  return figmaRestApi.get<FileStylesResponse>('files/' + fileId + '/styles', {
    headers: {
      ...getFigmaAuthHeaders(accessToken)
    },
  });
};

export const getComponentSets = (fileId: string, accessToken: string) => {
  counter++;
  return figmaRestApi.get<FileComponentSetsResponse>('files/' + fileId + '/component_sets', {
    headers: {
      ...getFigmaAuthHeaders(accessToken)
    },
  });
};

export const getComponentSetNodes = (fileId: string, ids: string[], accessToken: string) => {
  counter++;
  return figmaRestApi.get<FileNodesResponse>('files/' + fileId + '/nodes?ids=' + ids.join(',') + '&plugin_data=shared', {
    headers: {
      ...getFigmaAuthHeaders(accessToken)
    },
  });
};

export const getRequestCount = () => counter;
export default figmaRestApi;

const getFigmaAuthHeaders = (accessToken: string): { [header: string]: string } =>
  accessToken.startsWith('Bearer ') ? { 'Authorization': accessToken } : { 'X-Figma-Token': accessToken };
