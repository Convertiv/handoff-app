import { AxiosInstance } from 'axios';
import { FileResponse, FileNodesResponse, FileImageResponse, FileStylesResponse, FileComponentSetsResponse, FileComponentsResponse } from './types.js';
declare const figmaRestApi: AxiosInstance;
export declare const getFile: (fileId: string, accessToken: string) => Promise<import("axios").AxiosResponse<FileResponse, any>>;
/**
 * Fetch the frontend components
 * @param fileId
 * @param accessToken
 * @returns Promise<FileComponentsResponse>
 */
export declare const getFileComponent: (fileId: string, accessToken: string) => Promise<import("axios").AxiosResponse<FileComponentsResponse, any>>;
export declare const getFileNodes: (fileId: string, ids: string[], accessToken: string) => Promise<import("axios").AxiosResponse<FileNodesResponse, any>>;
export declare const getAssetURL: (fileId: string, ids: string[], extension: string, accessToken: string) => Promise<import("axios").AxiosResponse<FileImageResponse, any>>;
export declare const getFileStyles: (fileId: string, accessToken: string) => Promise<import("axios").AxiosResponse<FileStylesResponse, any>>;
export declare const getComponentSets: (fileId: string, accessToken: string) => Promise<import("axios").AxiosResponse<FileComponentSetsResponse, any>>;
export declare const getComponentSetNodes: (fileId: string, ids: string[], accessToken: string) => Promise<import("axios").AxiosResponse<FileNodesResponse, any>>;
export declare const getRequestCount: () => number;
export default figmaRestApi;
