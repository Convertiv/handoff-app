import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { PlaygroundComponent, SelectedPlaygroundComponent } from './types';
import { renderPreview } from './preview';

interface Template {
  name: string;
  components: SelectedPlaygroundComponent[];
  created_at: string;
  updated_at: string;
}

interface PlaygroundContextType {
  components: PlaygroundComponent[];
  selectedComponents: SelectedPlaygroundComponent[];
  loading: boolean;
  error: string | null;
  addComponent: (component: PlaygroundComponent) => void;
  removeComponent: (uniqueId: string) => void;
  updateComponent: (component: SelectedPlaygroundComponent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  templates: Template[];
  saveAsTemplate: (templateName: string) => void;
  loadTemplate: (templateName: string) => void;
  deleteTemplate: (templateName: string) => void;
}

const STORAGE_KEY = 'handoff-playground-components';
const TEMPLATE_PREFIX = 'handoff-playground-template-';

const PlaygroundContext = createContext<PlaygroundContextType | undefined>(undefined);

const componentCache: Record<string, PlaygroundComponent> = {};

async function fetchComponentDetail(id: string, basePath: string): Promise<PlaygroundComponent> {
  if (componentCache[id]) {
    return { ...componentCache[id] };
  }

  const response = await fetch(`${basePath}/api/component/${id}.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch component: ${response.statusText}`);
  }

  const component = await response.json();
  if (component.previews?.generic) {
    component.data = component.previews.generic.values;
  } else {
    component.data = {};
  }

  delete component.jsCompiled;
  delete component.css;
  delete component.js;
  delete component.entries;
  delete component.options;
  delete component.sass;

  componentCache[id] = component;
  return { ...component };
}

export function PlaygroundProvider({ children }: { children: ReactNode }) {
  const [components, setComponents] = useState<PlaygroundComponent[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<SelectedPlaygroundComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);

  const basePath = typeof process !== 'undefined' ? process.env.HANDOFF_APP_BASE_PATH ?? '' : '';

  useEffect(() => {
    const loadComponents = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${basePath}/api/components.json`);
        if (!response.ok) throw new Error(`Failed to fetch components: ${response.statusText}`);
        const fetched: PlaygroundComponent[] = await response.json();
        setComponents(fetched);
      } catch (err) {
        setError('Failed to load components. Please try again.');
        console.error('Error loading components:', err);
      } finally {
        setLoading(false);
      }
    };

    loadComponents();
    setTemplates(getTemplatesFromStorage());
  }, [basePath]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSelectedComponents(JSON.parse(saved));
      } catch {
        // ignore corrupt data
      }
    }
  }, []);

  useEffect(() => {
    if (selectedComponents.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedComponents));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedComponents]);

  const addComponent = useCallback(
    async (component: PlaygroundComponent) => {
      const detail = await fetchComponentDetail(component.id, basePath);
      detail.rendered = await renderPreview(detail);
      setSelectedComponents((prev) => [
        ...prev,
        {
          ...detail,
          order: prev.length,
          quantity: 1,
          uniqueId: `${component.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      ]);
    },
    [basePath]
  );

  const removeComponent = useCallback((uniqueId: string) => {
    setSelectedComponents((prev) => prev.filter((c) => c.uniqueId !== uniqueId));
  }, []);

  const updateComponent = useCallback((component: SelectedPlaygroundComponent) => {
    setSelectedComponents((prev) => prev.map((c) => (c.uniqueId === component.uniqueId ? component : c)));
  }, []);

  const onDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setSelectedComponents((items) => {
        const oldIndex = items.findIndex((item) => item.uniqueId === active.id);
        const newIndex = items.findIndex((item) => item.uniqueId === over?.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({ ...item, order: index }));
      });
    }
  }, []);

  const saveAsTemplate = useCallback(
    (templateName: string) => {
      const template: Template = {
        name: templateName,
        components: selectedComponents,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTemplates((prev) => [...prev, template]);
      localStorage.setItem(`${TEMPLATE_PREFIX}${templateName}`, JSON.stringify(template));
    },
    [selectedComponents]
  );

  const loadTemplate = useCallback((templateName: string) => {
    const raw = localStorage.getItem(`${TEMPLATE_PREFIX}${templateName}`);
    if (raw) {
      try {
        const template = JSON.parse(raw);
        setSelectedComponents(template.components || []);
      } catch {
        // ignore
      }
    }
  }, []);

  const deleteTemplate = useCallback((templateName: string) => {
    setTemplates((prev) => prev.filter((t) => t.name !== templateName));
    localStorage.removeItem(`${TEMPLATE_PREFIX}${templateName}`);
  }, []);

  return (
    <PlaygroundContext.Provider
      value={{
        components,
        selectedComponents,
        loading,
        error,
        addComponent,
        removeComponent,
        updateComponent,
        onDragEnd,
        templates,
        saveAsTemplate,
        loadTemplate,
        deleteTemplate,
      }}
    >
      {children}
    </PlaygroundContext.Provider>
  );
}

function getTemplatesFromStorage(): Template[] {
  const templates: Template[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(TEMPLATE_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          templates.push({
            name: key.replace(TEMPLATE_PREFIX, ''),
            components: parsed.components || [],
            created_at: parsed.created_at || new Date().toISOString(),
            updated_at: parsed.updated_at || new Date().toISOString(),
          });
        }
      } catch {
        // ignore
      }
    }
  }
  return templates;
}

export function usePlayground() {
  const context = useContext(PlaygroundContext);
  if (context === undefined) {
    throw new Error('usePlayground must be used within a PlaygroundProvider');
  }
  return context;
}
