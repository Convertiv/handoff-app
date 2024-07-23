import React, { createContext, useContext, useState } from 'react';
import { PreviewJson, PreviewObject } from '../../../types';
import { ClientConfig } from '../../../types/config';
interface IMdxContext {
  preview?: PreviewJson;
  setPreview: (preview: PreviewJson) => void;
  getPreview: (name: string) => PreviewObject;
  metadata: Record<string, any>;
  setMetadata: (metadata: Record<string, any>) => void;
  menu: Record<string, any>;
  setMenu: (menu: Record<string, any>) => void;
  config?: ClientConfig;
  setConfig?: (config: ClientConfig) => void;
}
interface IMdxContextProviderProps {
  children: React.ReactNode;
  defaultPreview?: PreviewJson;
  defaultMetadata?: Record<string, any>;
  defaultMenu?: Record<string, any>;
  defaultConfig?: ClientConfig;  
}

export const MdxContext = createContext<IMdxContext | undefined>(undefined);

export const MdxContextProvider: React.FC<IMdxContextProviderProps> = ({ children, defaultMenu, defaultMetadata, defaultPreview, defaultConfig }) => {
  const [preview, setPreview] = useState<PreviewJson>(defaultPreview);
  const [config, setConfig] = useState<ClientConfig>(defaultConfig);
  const getPreview = (name: string) => {
    if(!preview) return null;
    const components = preview.components;
    return components[name] ? components[name][0] : null;
  };
  const [metadata, setMetadata] = useState<Record<string, any>>(defaultMetadata);
  const [menu, setMenu] = useState<Record<string, any>>(defaultMenu);
  return (
    <MdxContext.Provider
      value={{
        preview,
        setPreview,
        getPreview,
        metadata,
        setMetadata,
        menu,
        setMenu,
        config,
        setConfig
      }}
    >
      {children}
    </MdxContext.Provider>
  );
};

export const useMdxContext = () => {
  const context = useContext(MdxContext);
  if (!context) {
    throw new Error('useMdxContext must be used within a MdxContext.');
  }
  return context;
};
