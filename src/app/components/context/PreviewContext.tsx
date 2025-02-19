import { PreviewJson, PreviewObject } from '@handoff/types';
import { ClientConfig } from '@handoff/types/config';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
interface IPreviewContext {
  preview?: PreviewJson;
  setPreview: (preview: PreviewJson) => void;
  getPreview: () => Promise<PreviewObject>;
  variants?: Record<string, string[]>;
  variantFilter?: Record<string, string>;
  updateVariantFilter: (key: string, value: string) => void;
  metadata: Record<string, any>;
  setMetadata: (metadata: Record<string, any>) => void;
  menu: Record<string, any>;
  setMenu: (menu: Record<string, any>) => void;
  config?: ClientConfig;
  setConfig?: (config: ClientConfig) => void;
}
interface IPreviewContextProviderProps {
  children: React.ReactNode;
  id: string;
  isFigmaComponent?: boolean;
  componentList?: Record<string, any>;
  defaultPreview?: PreviewJson;
  defaultMetadata?: Record<string, any>;
  defaultMenu?: Record<string, any>;
  defaultConfig?: ClientConfig;
}

type VariantItem = {
  id: string;
  variant?: Record<string, string>;
};

function groupVariantProperties(items: VariantItem[]): Record<string, string[]> {
  const grouped: Record<string, Set<string>> = {};

  for (const item of items) {
    for (const [key, value] of Object.entries(item.variant)) {
      (grouped[key] ||= new Set()).add(value);
    }
  }

  return Object.fromEntries(Object.entries(grouped).map(([key, set]) => [key, Array.from(set)]));
}

export const PreviewContext = createContext<IPreviewContext | undefined>(undefined);

export const PreviewContextProvider: React.FC<IPreviewContextProviderProps> = ({
  children,
  id,
  isFigmaComponent,
  defaultMenu,
  defaultMetadata,
  defaultPreview,
  defaultConfig,
}) => {
  const [preview, setPreview] = useState<PreviewJson>(defaultPreview);
  const [config, setConfig] = useState<ClientConfig>(defaultConfig);
  const [variants, setVariants] = useState<Record<string, string[]> | undefined>(null);
  const [variantFilter, setVariantFilter] = useState<Record<string, string> | undefined>(undefined);

  useEffect(() => {
    if (id && preview && isFigmaComponent) {
      setVariants(groupVariantProperties(preview.components[id]));
    }
  }, [id, preview, isFigmaComponent]);

  useEffect(() => {
    if (!variants) {
      return;
    }

    const initialSelection: Record<string, string> = {};

    for (const key in variants) {
      if (variants[key].length > 0) {
        initialSelection[key] = variants[key][0]; // Default to the first option
      }
    }

    setVariantFilter(initialSelection);
  }, [isFigmaComponent, variants]); // Re-run when items change

  const getPreview = useCallback(async () => {
    if (!preview) return null;
    const components = preview.components;

    if (components[id]) {
      if (variantFilter) {
        return components[id].filter((item) => Object.entries(variantFilter).every(([key, value]) => item.variant[key] === value))[0];
      }

      return components[id]?.[0] ?? null;
    }

    try {
      const response = await fetch(`/api/component/${id}/latest.json`);
      const data = await response.json();
      return data as PreviewObject;
    } catch (error) {
      console.error('Error fetching preview:', error);
      return null;
    }
  }, [id, preview, variantFilter]);

  const updateVariantFilter = useCallback((key: string, value: string) => {
    setVariantFilter((prev) => ({ ...prev, [key]: value }));
  }, []);

  const [metadata, setMetadata] = useState<Record<string, any>>(defaultMetadata);
  const [menu, setMenu] = useState<Record<string, any>>(defaultMenu);

  return (
    <PreviewContext.Provider
      value={{
        preview,
        setPreview,
        getPreview,
        variants,
        variantFilter,
        updateVariantFilter,
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
