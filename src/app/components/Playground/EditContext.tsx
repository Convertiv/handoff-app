import { createContext, ReactNode, RefObject, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePlayground } from './PlaygroundContext';
import { renderHandlebarsPreview, renderPreview, renderReactPreview } from './Preview';
import { SelectedPlaygroundComponent } from './types';

interface EditContextType {
  component: SelectedPlaygroundComponent | null;
  data: any;
  setData: (data: any) => void;
  properties: any;
  previewHtml: string;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  mediaBrowserOpen: boolean;
  setMediaBrowserOpen: (open: boolean) => void;
  currentImagePath: string[];
  setCurrentImagePath: (path: string[]) => void;
  getData: (path: string[], localData?: any) => any;
  handleInputChange: (path: string[], value: any) => any;
  handleMediaSelect: (image: { src: string; srcset: string; alt: string }) => void;
  handleSave: () => void;
}

const EditContext = createContext<EditContextType | undefined>(undefined);

export function EditContextProvider({ component, children }: { component: SelectedPlaygroundComponent | null; children: ReactNode }) {
  const { updateComponent } = usePlayground();
  const [data, setData] = useState<any>(null);
  const [properties, setProperties] = useState<any>({});
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [mediaBrowserOpen, setMediaBrowserOpen] = useState(false);
  const [currentImagePath, setCurrentImagePath] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const initialRenderDone = useRef(false);

  const basePath = typeof process !== 'undefined' ? process.env.HANDOFF_APP_BASE_PATH ?? '' : '';
  const isReact = component?.format === 'react';

  useEffect(() => {
    if (component) {
      setData(component.data);
      setProperties(component.properties);
      initialRenderDone.current = false;

      if (isReact) {
        setPreviewHtml(renderReactPreview(component, component.data, basePath));
      } else {
        setPreviewHtml(renderHandlebarsPreview(component, component.data, basePath));
      }
    }
  }, [component, basePath, isReact]);

  useEffect(() => {
    if (!component || data === null) return;

    if (isReact) {
      if (!initialRenderDone.current) {
        initialRenderDone.current = true;
        return;
      }
      // For React: send props update via postMessage to avoid reloading the module
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: 'update-props', props: data }, '*');
      }
    } else {
      const html = renderHandlebarsPreview(component, data, basePath);
      setPreviewHtml(html);
    }
  }, [data, component, basePath, isReact]);

  const handleInputChange = useCallback(
    (path: string[], value: any) => {
      const target = path[path.length - 1];
      setData((prev: any) => {
        const newData = { ...prev };
        let current = newData;
        for (let i = 0; i < path.length - 1; i++) {
          if (!current[path[i]]) {
            current[path[i]] = {};
          }
          current = current[path[i]];
        }
        if (!current) {
          current = { [target]: value };
        } else {
          current[target] = value;
        }
        return newData;
      });
      return value;
    },
    []
  );

  const getData = useCallback(
    (path: string[], localData?: any) => {
      let current = localData || data;
      for (let i = 0; i < path.length; i++) {
        if (!current) return null;
        if (current[path[i]]) {
          current = current[path[i]];
        } else {
          current = null;
        }
      }
      return current;
    },
    [data]
  );

  const handleMediaSelect = useCallback(
    (image: { src: string; srcset: string; alt: string }) => {
      if (currentImagePath.length > 0) {
        handleInputChange([...currentImagePath, 'src'], image.src);
        handleInputChange([...currentImagePath, 'srcset'], image.srcset);
        handleInputChange([...currentImagePath, 'alt'], image.alt);
      }
      setMediaBrowserOpen(false);
    },
    [currentImagePath, handleInputChange]
  );

  const handleSave = useCallback(async () => {
    if (!component) return;
    const updatedComponent = { ...component, data };
    updatedComponent.rendered = await renderPreview(updatedComponent, data, basePath);
    updateComponent(updatedComponent);
  }, [component, data, updateComponent, basePath]);

  return (
    <EditContext.Provider
      value={{
        component,
        data,
        setData,
        properties,
        previewHtml,
        iframeRef,
        mediaBrowserOpen,
        setMediaBrowserOpen,
        currentImagePath,
        setCurrentImagePath,
        getData,
        handleInputChange,
        handleMediaSelect,
        handleSave,
      }}
    >
      {children}
    </EditContext.Provider>
  );
}

export function useEditContext() {
  const context = useContext(EditContext);
  if (context === undefined) {
    throw new Error('useEditContext must be used within an EditContextProvider');
  }
  return context;
}
