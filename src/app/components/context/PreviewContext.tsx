import React, { createContext, useContext, useState } from 'react';
import { PreviewJson, PreviewObject } from '@handoff/types';
import { ClientConfig } from '@handoff/types/config';
interface IPreviewContext {
  preview?: PreviewJson;
  setPreview: (preview: PreviewJson) => void;
  getPreview: (name: string) => Promise<PreviewObject>;
  metadata: Record<string, any>;
  setMetadata: (metadata: Record<string, any>) => void;
  menu: Record<string, any>;
  setMenu: (menu: Record<string, any>) => void;
  config?: ClientConfig;
  setConfig?: (config: ClientConfig) => void;
}
interface IPreviewContextProviderProps {
  children: React.ReactNode;
  componentList?: Record<string, any>;
  defaultPreview?: PreviewJson;
  defaultMetadata?: Record<string, any>;
  defaultMenu?: Record<string, any>;
  defaultConfig?: ClientConfig;
}

export const PreviewContext = createContext<IPreviewContext | undefined>(undefined);

export const PreviewContextProvider: React.FC<IPreviewContextProviderProps> = ({
  children,
  defaultMenu,
  defaultMetadata,
  defaultPreview,
  defaultConfig,
}) => {
  const [preview, setPreview] = useState<PreviewJson>(defaultPreview);
  const [config, setConfig] = useState<ClientConfig>(defaultConfig);

  const getPreview = async (name: string) => {
    if (!preview) return null;
    const components = preview.components;
    if (components[name]) {
      return components[name] ? components[name][0] : null;
    } else {
      // Try to load the component from the public json
      let data = await fetch(`/api/component/${name}.json`).then((res) => res.json());
      return data.latest as PreviewObject;
    }
  };

  

  const [metadata, setMetadata] = useState<Record<string, any>>(defaultMetadata);
  const [menu, setMenu] = useState<Record<string, any>>(defaultMenu);
  return (
    <PreviewContext.Provider
      value={{
        preview,
        setPreview,
        getPreview,
        metadata,
        setMetadata,
        menu,
        setMenu,
        config,
        setConfig,
      }}
    >
      {children}
    </PreviewContext.Provider>
  );
};

export const usePreviewContext = () => {
  const context = useContext(PreviewContext);
  if (!context) {
    throw new Error('usePreviewContext must be used within a MdxContext.');
  }
  return context;
};
