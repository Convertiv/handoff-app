import React, { createContext, useContext, useState } from 'react';
import { PreviewObject } from '../../../types';
interface IMDxContext {
  preview?: PreviewObject;
  setPreview: (preview: PreviewObject) => void;
  getPreview: (name: string) => PreviewObject;
  metadata: Record<string, any>;
  setMetadata: (metadata: Record<string, any>) => void;
  menu: Record<string, any>;
  setMenu: (menu: Record<string, any>) => void;
}
interface IMdxContextProviderProps {
  children: React.ReactNode;
}
export const MDXContext = createContext<IMDxContext | undefined>(undefined);

export const MdxContext: React.FC<IMdxContextProviderProps> = ({ children }) => {
  const [preview, setPreview] = useState<PreviewObject>(undefined);
  const getPreview = (name: string) => {
    return preview[name];
  };
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [menu, setMenu] = useState<Record<string, any>>({});
  return (
    <MDXContext.Provider
      value={{
        preview,
        setPreview,
        getPreview,
        metadata,
        setMetadata,
        menu,
        setMenu,
      }}
    >
      {children}
    </MDXContext.Provider>
  );
};

export const useMdxContext = () => {
  const context = useContext(MDXContext);
  if (!context) {
    throw new Error('useMdxContext must be used within a MdxContext.');
  }
  return context;
};
