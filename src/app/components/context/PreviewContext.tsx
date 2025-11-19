import { PreviewObject } from '@handoff/types';
import { ClientConfig } from '@handoff/types/config';
import { evaluateFilter, type Filter } from '@handoff/utils/filter';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface IPreviewContext {
  preview?: PreviewObject;
  setPreview: (preview: PreviewObject) => void;
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
  defaultPreview?: PreviewObject;
  defaultMetadata?: Record<string, any>;
  defaultMenu?: Record<string, any>;
  defaultConfig?: ClientConfig;
}

function groupVariantProperties(items: Record<string, string>[]): Record<string, string[]> {
  const grouped: Record<string, Set<string>> = {};

  for (const item of items) {
    for (const [key, value] of Object.entries(item)) {
      (grouped[key] ||= new Set()).add(value);
    }
  }

  return Object.fromEntries(
    Object.entries(grouped).map(([key, set]) => [key, Array.from(set)])
    // .filter((i) => i[1].length > 1)
  );
}

function filterPreviews(previews: Record<string, any>, filter: Filter): Record<string, any> {
  return Object.fromEntries(Object.entries(previews).filter(([_, preview]) => evaluateFilter(preview.values, filter)));
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
  const [preview, setPreview] = useState<PreviewObject>(defaultPreview);
  const [config, setConfig] = useState<ClientConfig>(defaultConfig);
  const [variants, setVariants] = useState<Record<string, string[]> | undefined>(null);
  const [variantFilter, setVariantFilter] = useState<Record<string, string> | undefined>(undefined);

  useEffect(() => {
    setPreview(defaultPreview);
  }, [defaultPreview]);

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

  const updateVariantFilter = useCallback((key: string, value: string) => {
    setVariantFilter((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    if (!preview) return;

    if (!preview.options?.preview?.groupBy) return;

    let filteredPreviews = preview.previews;
    if (preview.options?.preview?.filterBy) {
      filteredPreviews = filterPreviews(preview.previews, preview.options.preview.filterBy);
    }

    setVariants(
      groupVariantProperties(
        Object.values(filteredPreviews).map((p) => {
          return Object.keys(p.values).reduce((acc, next) => {
            acc[next] = p.values[next];
            return acc;
          }, {});
        })
      )
    );
  }, [preview]);

  const [metadata, setMetadata] = useState<Record<string, any>>(defaultMetadata);
  const [menu, setMenu] = useState<Record<string, any>>(defaultMenu);

  return (
    <PreviewContext.Provider
      value={{
        preview,
        setPreview,
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
  // Need to rewrite this so we don't have to manage the context as agressively
  if (!context) {
    throw new Error('usePreviewContext must be used within a PreviewContext.');
  }
  return context;
};
